import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SystemService } from '../system/system.service';
import { PaymentService, PaymentConfig } from '../payment/payment.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('后台管理')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'editor', 'moderator', 'operator')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemService: SystemService,
    private readonly paymentService: PaymentService,
  ) {}

  // ============== 数据看板 ==============
  @Get('dashboard')
  @ApiOperation({ summary: '数据看板' })
  async getDashboard() {
    return this.systemService.getDashboardStats();
  }

  @Get('big-screen')
  @ApiOperation({ summary: '数据大屏聚合统计' })
  async getBigScreenStats() {
    return this.systemService.getBigScreenStats();
  }

  /** 大屏底部滚动播报：最近 24h 内的新增数据（用户/活动/商机/订单/商品） */
  @Get('recent-activities')
  @ApiOperation({ summary: '大屏：近期新增动态（最近24h）' })
  async getRecentActivities(@Query('limit') limit?: string) {
    const n = Math.max(1, Math.min(50, parseInt(limit || '20', 10) || 20));
    const data = await this.systemService.getRecentActivities(n);
    return { code: 0, data };
  }

  // ============== 系统配置 ==============
  @Get('configs')
  @Roles('admin')
  @ApiOperation({ summary: '获取所有配置' })
  async getConfigs() {
    return this.systemService.getConfigs();
  }

  @Post('configs')
  @Roles('admin')
  @ApiOperation({ summary: '批量保存配置' })
  async saveConfigs(@Body() configs: { key: string; value: string; description?: string }[]) {
    await this.systemService.setConfigs(configs);
    return { code: 0, data: { success: true } };
  }

  @Get('config/:key')
  @Roles('admin')
  @ApiOperation({ summary: '获取单个配置' })
  async getConfig(@Param('key') key: string) {
    return { key, value: await this.systemService.getConfig(key) };
  }

  @Put('config/:key')
  @Roles('admin')
  @ApiOperation({ summary: '设置单个配置' })
  async setConfig(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    await this.systemService.setConfig(key, body.value, body.description || '');
    return { success: true };
  }

  @Delete('config/:key')
  @Roles('admin')
  @ApiOperation({ summary: '删除配置' })
  async deleteConfig(@Param('key') key: string) {
    await this.systemService.deleteConfig(key);
    return { success: true };
  }

  // ============== 支付配置 ==============
  @Get('payment-config')
  @Roles('admin')
  @ApiOperation({ summary: '获取支付配置' })
  async getPaymentConfig() {
    return { code: 0, data: await this.paymentService.getPaymentConfig() };
  }

  @Put('payment-config')
  @Roles('admin')
  @ApiOperation({ summary: '保存支付配置' })
  async savePaymentConfig(@Body() config: PaymentConfig) {
    const keyMap: Record<string, string> = {
      channel: 'payment_channel',
      wxAppId: 'payment_wx_appid',
      wxSecret: 'payment_wx_secret',
      wxMchId: 'payment_wx_mchid',
      wxApiKey: 'payment_wx_api_key',
      wxNotifyUrl: 'payment_wx_notify_url',
      wxRefundNotifyUrl: 'payment_wx_refund_notify_url',
      wxCertPath: 'payment_wx_cert_path',
      wxCertKeyPath: 'payment_wx_cert_key_path',
      wxP12Path: 'payment_wx_p12_path',
      alipayAppId: 'payment_alipay_appid',
      alipayPrivateKey: 'payment_alipay_private_key',
      alipayPublicKey: 'payment_alipay_public_key',
      alipayNotifyUrl: 'payment_alipay_notify_url',
    };
    const descriptions: Record<string, string> = {
      payment_channel: '支付渠道：wechat / alipay',
      payment_wx_appid: '微信支付 AppID',
      payment_wx_secret: '微信支付 Secret',
      payment_wx_mchid: '微信支付商户号',
      payment_wx_api_key: '微信支付 API 密钥',
      payment_wx_notify_url: '微信支付回调地址',
      payment_wx_refund_notify_url: '微信支付退款回调地址',
      payment_wx_cert_path: '微信支付 API 证书路径（apiclient_cert.pem）',
      payment_wx_cert_key_path: '微信支付 API 证书私钥路径（apiclient_key.pem）',
      payment_wx_p12_path: '微信支付 P12 证书路径（可选）',
      payment_alipay_appid: '支付宝 AppID',
      payment_alipay_private_key: '支付宝私钥',
      payment_alipay_public_key: '支付宝公钥',
      payment_alipay_notify_url: '支付宝回调地址',
    };
    const configs = Object.entries(config).map(([key, value]) => ({
      key: keyMap[key] || key,
      value: String(value ?? ''),
      description: descriptions[keyMap[key] || key] || '',
    }));
    await this.systemService.setConfigs(configs);
    return { code: 0, data: { success: true } };
  }

  @Post('payment-config/validate')
  @Roles('admin')
  @ApiOperation({ summary: '校验支付配置' })
  async validatePaymentConfig() {
    return { code: 0, data: await this.paymentService.validateConfig() };
  }

  // ============== Banner 管理 ==============
  @Get('banners')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: 'Banner列表' })
  async getBanners() {
    return this.systemService.getBanners();
  }

  @Post('banners')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '创建Banner' })
  async createBanner(@Body() body: any) {
    return this.systemService.createBanner(body);
  }

  @Put('banners/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新Banner' })
  async updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateBanner(+id, body);
  }

  @Delete('banners/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '删除Banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.systemService.deleteBanner(+id);
  }

  @Get('banner-settings')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '获取Banner轮播设置' })
  async getBannerSettings() {
    return { bannerInterval: await this.systemService.getBannerInterval() };
  }

  @Put('banner-settings')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新Banner轮播设置' })
  async updateBannerSettings(@Body() body: { bannerInterval?: number }) {
    return { bannerInterval: await this.systemService.setBannerInterval(body?.bannerInterval || 4) };
  }

  // ============== 公告管理 ==============
  @Get('announcements')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '公告列表' })
  async getAnnouncements() {
    return this.systemService.getAnnouncements();
  }

  @Post('announcements')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '创建公告' })
  async createAnnouncement(@Body() body: any) {
    return this.systemService.createAnnouncement(body);
  }

  @Put('announcements/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新公告' })
  async updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateAnnouncement(+id, body);
  }

  @Delete('announcements/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '删除公告' })
  async deleteAnnouncement(@Param('id') id: string) {
    return this.systemService.deleteAnnouncement(+id);
  }

  // ============== 版本管理 ==============
  @Get('versions')
  @Roles('admin')
  @ApiOperation({ summary: '版本列表' })
  async getVersions() {
    return this.systemService.getVersions();
  }

  @Post('versions')
  @Roles('admin')
  @ApiOperation({ summary: '创建版本' })
  async createVersion(@Body() body: any) {
    return this.systemService.createVersion(body);
  }

  @Put('versions/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新版本' })
  async updateVersion(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateVersion(+id, body);
  }

  @Delete('versions/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除版本' })
  async deleteVersion(@Param('id') id: string) {
    return this.systemService.deleteVersion(+id);
  }

  // ============== 用户管理 ==============
  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: '用户列表' })
  async getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: '用户详情' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(+id);
  }

  @Put('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: '编辑用户' })
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateUser(+id, dto) };
  }

  @Delete('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteUser(+id) };
  }

  @Put('users/:id/disable')
  @Roles('admin')
  @ApiOperation({ summary: '禁用用户' })
  async disableUser(@Param('id') id: string) {
    return this.adminService.disableUser(+id);
  }

  @Put('users/:id/enable')
  @Roles('admin')
  @ApiOperation({ summary: '启用用户' })
  async enableUser(@Param('id') id: string) {
    return this.adminService.enableUser(+id);
  }

  @Put('users/:id/password')
  @Roles('admin')
  @ApiOperation({ summary: '修改用户密码' })
  async changeUserPassword(@Param('id') id: string, @Body('password') password: string) {
    await this.adminService.changeUserPassword(+id, password);
    return { code: 0, data: { success: true, message: '密码修改成功' } };
  }

  /** 获取系统预定义角色列表 */
  @Get('roles')
  @Roles('admin')
  @ApiOperation({ summary: '获取系统角色列表' })
  getSystemRoles() {
    return { code: 0, data: AdminService.VALID_ROLES };
  }

  /** 专用：更新用户角色（含安全校验） */
  @Put('users/:id/roles')
  @Roles('admin')
  @ApiOperation({ summary: '修改用户角色' })
  async updateUserRoles(
    @Param('id') id: string,
    @Body('roles') roles: string[],
    @CurrentUser() operator: any,
  ) {
    if (!Array.isArray(roles)) {
      throw new BadRequestException('roles 必须为数组格式');
    }
    const result = await this.adminService.updateUserRoles(+id, operator.userId || operator.id, roles);
    return { code: 0, data: result };
  }

  // ============== 后台账号管理 ==============
  @Get('staff')
  @Roles('admin')
  @Permissions('staff:manage')
  @ApiOperation({ summary: '后台账号列表' })
  async getStaffList(@Query() query: any) {
    return { code: 0, data: await this.adminService.getStaffList(query) };
  }

  @Post('staff')
  @Roles('admin')
  @Permissions('staff:manage')
  @ApiOperation({ summary: '新增后台账号' })
  async createStaff(@Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.createStaff(operator, dto, this.getClientIp(req)) };
  }

  @Put('staff/:id')
  @Roles('admin')
  @Permissions('staff:manage')
  @ApiOperation({ summary: '编辑后台账号' })
  async updateStaff(@Param('id') id: string, @Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.updateStaff(operator, +id, dto, this.getClientIp(req)) };
  }

  @Delete('staff/:id')
  @Roles('admin')
  @Permissions('staff:manage')
  @ApiOperation({ summary: '删除后台账号' })
  async deleteStaff(@Param('id') id: string, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.deleteStaff(operator, +id, this.getClientIp(req)) };
  }

  @Put('staff/:id/password')
  @Roles('admin')
  @Permissions('staff:manage')
  @ApiOperation({ summary: '重置后台账号密码' })
  async resetStaffPassword(@Param('id') id: string, @Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.resetStaffPassword(operator, +id, dto, this.getClientIp(req)) };
  }

  // ============== 修改当前管理员密码 ==============
  @Put('profile/password')
  @ApiOperation({ summary: '修改当前登录账号密码' })
  async changeOwnPassword(@Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.changeOwnPassword(operator, dto, this.getClientIp(req)) };
  }

  // ============== 角色权限管理 ==============
  @Get('permissions')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '获取权限目录' })
  getPermissionCatalog() {
    return { code: 0, data: AdminService.PERMISSION_CATALOG };
  }

  @Get('role-permissions')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '获取角色权限配置' })
  async getRolePermissions() {
    return { code: 0, data: await this.adminService.getRolePermissions() };
  }

  @Put('role-permissions/:code')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '保存角色权限配置' })
  async saveRolePermission(@Param('code') code: string, @Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.saveRolePermission(operator, code, dto, this.getClientIp(req)) };
  }

  @Post('roles')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '新增自定义角色' })
  async createRole(@Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.createRole(operator, dto, this.getClientIp(req)) };
  }

  @Put('roles/:code')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '编辑角色' })
  async updateRole(@Param('code') code: string, @Body() dto: any, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.updateRole(operator, code, dto, this.getClientIp(req)) };
  }

  @Delete('roles/:code')
  @Roles('admin')
  @Permissions('role:manage')
  @ApiOperation({ summary: '删除自定义角色' })
  async deleteRole(@Param('code') code: string, @CurrentUser() operator: any, @Req() req: any) {
    return { code: 0, data: await this.adminService.deleteRole(operator, code, this.getClientIp(req)) };
  }

  // ============== 操作日志 ==============
  @Get('operation-logs')
  @Roles('admin')
  @Permissions('log:view')
  @ApiOperation({ summary: '操作日志列表' })
  async getOperationLogs(@Query() query: any) {
    return { code: 0, data: await this.adminService.getOperationLogs(query) };
  }

  private getClientIp(req: any): string {
    const forwarded = req?.headers?.['x-forwarded-for'];
    if (forwarded) {
      return String(forwarded).split(',')[0].trim();
    }
    return req?.ip || req?.connection?.remoteAddress || '';
  }

  // ============== 活动管理 ==============
  @Get('activities')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '活动列表' })
  async getActivities(@Query() query: any) {
    const result = await this.adminService.getActivities(query);
    return { code: 0, data: result };
  }

  @Post('activities')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '新增活动（管理员发布，免审核）' })
  async createActivity(@Body() dto: CreateActivityDto) {
    return { code: 0, data: await this.adminService.createActivity(dto) };
  }

  @Get('activities/:id')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '活动详情' })
  async getActivityDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getActivityDetail(+id) };
  }

  @Put('activities/:id/approve')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: '审核通过活动' })
  async approveActivity(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.approveActivity(+id) };
  }

  @Put('activities/:id/reject')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: '拒绝活动' })
  async rejectActivity(@Param('id') id: string, @Body('reason') reason?: string) {
    return { code: 0, data: await this.adminService.rejectActivity(+id, reason) };
  }

  @Put('activities/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '编辑活动' })
  async updateActivity(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateActivity(+id, dto) };
  }

  @Delete('activities/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '删除活动' })
  async deleteActivity(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteActivity(+id) };
  }

  @Post('activities/clear-signups')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '清空所有活动报名数据' })
  async clearAllActivitySignups() {
    const result = await this.adminService.clearAllActivitySignups();
    return { code: 0, data: result };
  }

  @Delete('activities/:id/signups')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '清空单个活动的所有报名记录' })
  async clearSingleActivitySignups(@Param('id') id: string) {
    await this.adminService.clearActivitySignups(+id);
    await this.adminService.resetActivitySignupCount(+id);
    return { code: 0, data: { success: true, message: '报名数据已清空' } };
  }

  @Get('activities/:id/signups/export')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '导出活动报名人员' })
  async exportActivitySignups(@Param('id') id: string) {
    const result = await this.adminService.exportActivitySignups(+id);
    return { code: 0, data: result };
  }

  @Get('activities/:id/qrcode')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '获取活动核销二维码' })
  async generateActivityQrCode(@Param('id') id: string) {
    const result = await this.adminService.generateActivityVerifyQrCode(+id);
    return { code: 0, data: result };
  }

  // ============== 商机管理 ==============
  @Get('businesses')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '商机列表' })
  async getBusinesses(@Query() query: any) {
    const result = await this.adminService.getBusinesses(query);
    return { code: 0, data: result };
  }

  @Post('businesses')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '新增商机（管理员发布，免审核）' })
  async createBusiness(@Body() dto: CreateBusinessDto) {
    return { code: 0, data: await this.adminService.createBusiness(dto) };
  }

  @Get('business-categories')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '商机分类列表' })
  async getBusinessCategories() {
    return { code: 0, data: await this.adminService.getBusinessCategories() };
  }

  @Get('businesses/:id')
  @Roles('admin', 'editor', 'moderator', 'operator')
  @ApiOperation({ summary: '商机详情' })
  async getBusinessDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getBusinessDetail(+id) };
  }

  @Put('businesses/:id/approve')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: '审核通过商机' })
  async approveBusiness(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.approveBusiness(+id) };
  }

  @Put('businesses/:id/reject')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: '拒绝商机' })
  async rejectBusiness(@Param('id') id: string, @Body('reason') reason?: string) {
    return { code: 0, data: await this.adminService.rejectBusiness(+id, reason) };
  }

  @Put('businesses/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '编辑商机' })
  async updateBusiness(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateBusiness(+id, dto) };
  }

  @Delete('businesses/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '删除商机' })
  async deleteBusiness(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteBusiness(+id) };
  }

  @Put('businesses/:id/status')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '上下架商机' })
  async toggleBusinessStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return { code: 0, data: await this.adminService.toggleBusinessStatus(+id, body.status) };
  }

  // ============== 商品管理 ==============
  @Get('products')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '商品列表' })
  async getProducts(@Query() query: any) {
    return { code: 0, data: await this.adminService.getProducts(query) };
  }

  @Get('products/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '商品详情' })
  async getProduct(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getProduct(+id) };
  }

  @Post('products')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '创建商品' })
  async createProduct(@Body() body: CreateProductDto) {
    return { code: 0, data: await this.adminService.createProduct(body) };
  }

  @Put('products/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '更新商品' })
  async updateProduct(@Param('id') id: string, @Body() body: CreateProductDto) {
    return { code: 0, data: await this.adminService.updateProduct(+id, body) };
  }

  @Put('products/:id/status')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '上下架商品' })
  async toggleProductStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return { code: 0, data: await this.adminService.toggleProductStatus(+id, body.status) };
  }

  @Delete('products/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '删除商品' })
  async deleteProduct(@Param('id') id: string) {
    await this.adminService.deleteProduct(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 商品分类管理 ==============
  @Get('product-categories')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '商品分类列表' })
  async getProductCategories(@Query('keyword') keyword?: string) {
    return { code: 0, data: await this.adminService.getProductCategories(keyword) };
  }

  @Post('product-categories')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '创建商品分类' })
  async createProductCategory(@Body() body: any) {
    return { code: 0, data: await this.adminService.createProductCategory(body) };
  }

  @Put('product-categories/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '更新商品分类' })
  async updateProductCategory(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateProductCategory(+id, body) };
  }

  @Delete('product-categories/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '删除商品分类' })
  async deleteProductCategory(@Param('id') id: string) {
    await this.adminService.deleteProductCategory(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 商机分类管理 ==============
  @Get('business-category-list')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '商机分类列表（管理端）' })
  async getCategoryList(@Query('keyword') keyword?: string) {
    return { code: 0, data: await this.adminService.getCategoryList(keyword) };
  }

  @Get('business-category-list/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '商机分类详情' })
  async getCategoryDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getCategoryDetail(+id) };
  }

  @Post('business-category-list')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '创建商机分类' })
  async createCategory(@Body() body: any) {
    return { code: 0, data: await this.adminService.createCategory(body) };
  }

  @Put('business-category-list/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '更新商机分类' })
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateCategory(+id, body) };
  }

  @Delete('business-category-list/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: '删除商机分类' })
  async deleteCategory(@Param('id') id: string) {
    await this.adminService.deleteCategory(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 订单管理 ==============
  @Get('orders')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '订单列表' })
  async getOrders(@Query() query: any) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '订单详情' })
  async getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(+id);
  }

  @Put('orders/:id/ship')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '发货' })
  async shipOrder(@Param('id') id: string, @Body() body: { shippingNo: string; shippingCompany: string }) {
    return this.adminService.shipOrder(+id, body.shippingNo || '', body.shippingCompany || '');
  }

  @Put('orders/:id/approve-refund')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '同意退款' })
  async approveRefund(@Param('id') id: string) {
    return this.adminService.approveRefund(+id);
  }

  @Put('orders/:id/reject-refund')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '拒绝退款' })
  async rejectRefund(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectRefund(+id, body.reason || '');
  }

  // ============== VIP 套餐管理 ==============
  @Get('vip-plans')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: 'VIP套餐列表' })
  async getVipPlans() {
    const list = await this.adminService.getVipPlans();
    return { code: 0, data: { list, total: list.length, page: 1, size: list.length } };
  }

  @Post('vip-plans')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '创建VIP套餐' })
  async createVipPlan(@Body() body: any) {
    return { code: 0, data: await this.adminService.createVipPlan(body) };
  }

  @Put('vip-plans/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新VIP套餐' })
  async updateVipPlan(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateVipPlan(+id, body) };
  }

  @Delete('vip-plans/:id')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '删除VIP套餐' })
  async deleteVipPlan(@Param('id') id: string) {
    await this.adminService.deleteVipPlan(+id);
    return { code: 0, data: { success: true } };
  }

  @Put('vip-plans/:id/status')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '切换VIP套餐状态' })
  async toggleVipPlanStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return { code: 0, data: await this.adminService.toggleVipPlanStatus(+id, body.status) };
  }

  // ============== 消息管理 ==============
  @Get('notifications')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '消息列表' })
  async getNotifications(@Query() query: any) {
    return this.adminService.getNotifications(query);
  }

  @Post('notifications')
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '发送通知' })
  async createNotification(@Body() body: any) {
    return this.adminService.createNotification(body);
  }
}
