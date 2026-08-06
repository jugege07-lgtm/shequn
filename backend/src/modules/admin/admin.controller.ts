import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SystemService } from '../system/system.service';
import { PaymentService, PaymentConfig } from '../payment/payment.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('后台管理')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
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

  // ============== 系统配置 ==============
  @Get('configs')
  @ApiOperation({ summary: '获取所有配置' })
  async getConfigs() {
    return this.systemService.getConfigs();
  }

  @Post('configs')
  @ApiOperation({ summary: '批量保存配置' })
  async saveConfigs(@Body() configs: { key: string; value: string; description?: string }[]) {
    await this.systemService.setConfigs(configs);
    return { code: 0, data: { success: true } };
  }

  @Get('config/:key')
  @ApiOperation({ summary: '获取单个配置' })
  async getConfig(@Param('key') key: string) {
    return { key, value: await this.systemService.getConfig(key) };
  }

  @Put('config/:key')
  @ApiOperation({ summary: '设置单个配置' })
  async setConfig(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    await this.systemService.setConfig(key, body.value, body.description || '');
    return { success: true };
  }

  @Delete('config/:key')
  @ApiOperation({ summary: '删除配置' })
  async deleteConfig(@Param('key') key: string) {
    await this.systemService.deleteConfig(key);
    return { success: true };
  }

  // ============== 支付配置 ==============
  @Get('payment-config')
  @ApiOperation({ summary: '获取支付配置' })
  async getPaymentConfig() {
    return { code: 0, data: await this.paymentService.getPaymentConfig() };
  }

  @Put('payment-config')
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
  @ApiOperation({ summary: '校验支付配置' })
  async validatePaymentConfig() {
    return { code: 0, data: await this.paymentService.validateConfig() };
  }

  // ============== Banner 管理 ==============
  @Get('banners')
  @ApiOperation({ summary: 'Banner列表' })
  async getBanners() {
    return this.systemService.getBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: '创建Banner' })
  async createBanner(@Body() body: any) {
    return this.systemService.createBanner(body);
  }

  @Put('banners/:id')
  @ApiOperation({ summary: '更新Banner' })
  async updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateBanner(+id, body);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: '删除Banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.systemService.deleteBanner(+id);
  }

  // ============== 公告管理 ==============
  @Get('announcements')
  @ApiOperation({ summary: '公告列表' })
  async getAnnouncements() {
    return this.systemService.getAnnouncements();
  }

  @Post('announcements')
  @ApiOperation({ summary: '创建公告' })
  async createAnnouncement(@Body() body: any) {
    return this.systemService.createAnnouncement(body);
  }

  @Put('announcements/:id')
  @ApiOperation({ summary: '更新公告' })
  async updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateAnnouncement(+id, body);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: '删除公告' })
  async deleteAnnouncement(@Param('id') id: string) {
    return this.systemService.deleteAnnouncement(+id);
  }

  // ============== 版本管理 ==============
  @Get('versions')
  @ApiOperation({ summary: '版本列表' })
  async getVersions() {
    return this.systemService.getVersions();
  }

  @Post('versions')
  @ApiOperation({ summary: '创建版本' })
  async createVersion(@Body() body: any) {
    return this.systemService.createVersion(body);
  }

  @Put('versions/:id')
  @ApiOperation({ summary: '更新版本' })
  async updateVersion(@Param('id') id: string, @Body() body: any) {
    return this.systemService.updateVersion(+id, body);
  }

  @Delete('versions/:id')
  @ApiOperation({ summary: '删除版本' })
  async deleteVersion(@Param('id') id: string) {
    return this.systemService.deleteVersion(+id);
  }

  // ============== 用户管理 ==============
  @Get('users')
  @ApiOperation({ summary: '用户列表' })
  async getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '用户详情' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(+id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: '编辑用户' })
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateUser(+id, dto) };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteUser(+id) };
  }

  @Put('users/:id/disable')
  @ApiOperation({ summary: '禁用用户' })
  async disableUser(@Param('id') id: string) {
    return this.adminService.disableUser(+id);
  }

  @Put('users/:id/enable')
  @ApiOperation({ summary: '启用用户' })
  async enableUser(@Param('id') id: string) {
    return this.adminService.enableUser(+id);
  }

  @Put('users/:id/password')
  @ApiOperation({ summary: '修改用户密码' })
  async changeUserPassword(@Param('id') id: string, @Body('password') password: string) {
    await this.adminService.changeUserPassword(+id, password);
    return { code: 0, data: { success: true, message: '密码修改成功' } };
  }

  /** 获取系统预定义角色列表 */
  @Get('roles')
  @ApiOperation({ summary: '获取系统角色列表' })
  getSystemRoles() {
    return { code: 0, data: AdminService.VALID_ROLES };
  }

  /** 专用：更新用户角色（含安全校验） */
  @Put('users/:id/roles')
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

  // ============== 活动管理 ==============
  @Get('activities')
  @ApiOperation({ summary: '活动列表' })
  async getActivities(@Query() query: any) {
    const result = await this.adminService.getActivities(query);
    return { code: 0, data: result };
  }

  @Post('activities')
  @ApiOperation({ summary: '新增活动（管理员发布，免审核）' })
  async createActivity(@Body() dto: CreateActivityDto) {
    return { code: 0, data: await this.adminService.createActivity(dto) };
  }

  @Get('activities/:id')
  @ApiOperation({ summary: '活动详情' })
  async getActivityDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getActivityDetail(+id) };
  }

  @Put('activities/:id/approve')
  @ApiOperation({ summary: '审核通过活动' })
  async approveActivity(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.approveActivity(+id) };
  }

  @Put('activities/:id/reject')
  @ApiOperation({ summary: '拒绝活动' })
  async rejectActivity(@Param('id') id: string, @Body('reason') reason?: string) {
    return { code: 0, data: await this.adminService.rejectActivity(+id, reason) };
  }

  @Put('activities/:id')
  @ApiOperation({ summary: '编辑活动' })
  async updateActivity(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateActivity(+id, dto) };
  }

  @Delete('activities/:id')
  @ApiOperation({ summary: '删除活动' })
  async deleteActivity(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteActivity(+id) };
  }

  @Post('activities/clear-signups')
  @ApiOperation({ summary: '清空所有活动报名数据' })
  async clearAllActivitySignups() {
    const result = await this.adminService.clearAllActivitySignups();
    return { code: 0, data: result };
  }

  @Delete('activities/:id/signups')
  @ApiOperation({ summary: '清空单个活动的所有报名记录' })
  async clearSingleActivitySignups(@Param('id') id: string) {
    await this.adminService.clearActivitySignups(+id);
    await this.adminService.resetActivitySignupCount(+id);
    return { code: 0, data: { success: true, message: '报名数据已清空' } };
  }

  @Get('activities/:id/signups/export')
  @ApiOperation({ summary: '导出活动报名人员' })
  async exportActivitySignups(@Param('id') id: string) {
    const result = await this.adminService.exportActivitySignups(+id);
    return { code: 0, data: result };
  }

  @Get('activities/:id/qrcode')
  @ApiOperation({ summary: '获取活动核销二维码' })
  async generateActivityQrCode(@Param('id') id: string) {
    const result = await this.adminService.generateActivityVerifyQrCode(+id);
    return { code: 0, data: result };
  }

  // ============== 商机管理 ==============
  @Get('businesses')
  @ApiOperation({ summary: '商机列表' })
  async getBusinesses(@Query() query: any) {
    const result = await this.adminService.getBusinesses(query);
    return { code: 0, data: result };
  }

  @Post('businesses')
  @ApiOperation({ summary: '新增商机（管理员发布，免审核）' })
  async createBusiness(@Body() dto: CreateBusinessDto) {
    return { code: 0, data: await this.adminService.createBusiness(dto) };
  }

  @Get('business-categories')
  @ApiOperation({ summary: '商机分类列表' })
  async getBusinessCategories() {
    return { code: 0, data: await this.adminService.getBusinessCategories() };
  }

  @Get('businesses/:id')
  @ApiOperation({ summary: '商机详情' })
  async getBusinessDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getBusinessDetail(+id) };
  }

  @Put('businesses/:id/approve')
  @ApiOperation({ summary: '审核通过商机' })
  async approveBusiness(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.approveBusiness(+id) };
  }

  @Put('businesses/:id/reject')
  @ApiOperation({ summary: '拒绝商机' })
  async rejectBusiness(@Param('id') id: string, @Body('reason') reason?: string) {
    return { code: 0, data: await this.adminService.rejectBusiness(+id, reason) };
  }

  @Put('businesses/:id')
  @ApiOperation({ summary: '编辑商机' })
  async updateBusiness(@Param('id') id: string, @Body() dto: any) {
    return { code: 0, data: await this.adminService.updateBusiness(+id, dto) };
  }

  @Delete('businesses/:id')
  @ApiOperation({ summary: '删除商机' })
  async deleteBusiness(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.deleteBusiness(+id) };
  }

  @Put('businesses/:id/status')
  @ApiOperation({ summary: '上下架商机' })
  async toggleBusinessStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return { code: 0, data: await this.adminService.toggleBusinessStatus(+id, body.status) };
  }

  // ============== 商品管理 ==============
  @Get('products')
  @ApiOperation({ summary: '商品列表' })
  async getProducts(@Query() query: any) {
    return { code: 0, data: await this.adminService.getProducts(query) };
  }

  @Get('products/:id')
  @ApiOperation({ summary: '商品详情' })
  async getProduct(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getProduct(+id) };
  }

  @Post('products')
  @ApiOperation({ summary: '创建商品' })
  async createProduct(@Body() body: CreateProductDto) {
    return { code: 0, data: await this.adminService.createProduct(body) };
  }

  @Put('products/:id')
  @ApiOperation({ summary: '更新商品' })
  async updateProduct(@Param('id') id: string, @Body() body: CreateProductDto) {
    return { code: 0, data: await this.adminService.updateProduct(+id, body) };
  }

  @Put('products/:id/status')
  @ApiOperation({ summary: '上下架商品' })
  async toggleProductStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return { code: 0, data: await this.adminService.toggleProductStatus(+id, body.status) };
  }

  @Delete('products/:id')
  @ApiOperation({ summary: '删除商品' })
  async deleteProduct(@Param('id') id: string) {
    await this.adminService.deleteProduct(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 商品分类管理 ==============
  @Get('product-categories')
  @ApiOperation({ summary: '商品分类列表' })
  async getProductCategories() {
    return { code: 0, data: await this.adminService.getProductCategories() };
  }

  @Post('product-categories')
  @ApiOperation({ summary: '创建商品分类' })
  async createProductCategory(@Body() body: any) {
    return { code: 0, data: await this.adminService.createProductCategory(body) };
  }

  @Put('product-categories/:id')
  @ApiOperation({ summary: '更新商品分类' })
  async updateProductCategory(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateProductCategory(+id, body) };
  }

  @Delete('product-categories/:id')
  @ApiOperation({ summary: '删除商品分类' })
  async deleteProductCategory(@Param('id') id: string) {
    await this.adminService.deleteProductCategory(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 商机分类管理 ==============
  @Get('business-category-list')
  @ApiOperation({ summary: '商机分类列表（管理端）' })
  async getCategoryList(@Query('keyword') keyword?: string) {
    return { code: 0, data: await this.adminService.getCategoryList(keyword) };
  }

  @Get('business-category-list/:id')
  @ApiOperation({ summary: '商机分类详情' })
  async getCategoryDetail(@Param('id') id: string) {
    return { code: 0, data: await this.adminService.getCategoryDetail(+id) };
  }

  @Post('business-category-list')
  @ApiOperation({ summary: '创建商机分类' })
  async createCategory(@Body() body: any) {
    return { code: 0, data: await this.adminService.createCategory(body) };
  }

  @Put('business-category-list/:id')
  @ApiOperation({ summary: '更新商机分类' })
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateCategory(+id, body) };
  }

  @Delete('business-category-list/:id')
  @ApiOperation({ summary: '删除商机分类' })
  async deleteCategory(@Param('id') id: string) {
    await this.adminService.deleteCategory(+id);
    return { code: 0, data: { success: true } };
  }

  // ============== 订单管理 ==============
  @Get('orders')
  @ApiOperation({ summary: '订单列表' })
  async getOrders(@Query() query: any) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '订单详情' })
  async getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(+id);
  }

  @Put('orders/:id/ship')
  @ApiOperation({ summary: '发货' })
  async shipOrder(@Param('id') id: string, @Body() body: { shippingNo: string; shippingCompany: string }) {
    return this.adminService.shipOrder(+id, body.shippingNo || '', body.shippingCompany || '');
  }

  @Put('orders/:id/approve-refund')
  @ApiOperation({ summary: '同意退款' })
  async approveRefund(@Param('id') id: string) {
    return this.adminService.approveRefund(+id);
  }

  @Put('orders/:id/reject-refund')
  @ApiOperation({ summary: '拒绝退款' })
  async rejectRefund(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectRefund(+id, body.reason || '');
  }

  // ============== VIP 套餐管理 ==============
  @Get('vip-plans')
  @ApiOperation({ summary: 'VIP套餐列表' })
  async getVipPlans() {
    const list = await this.adminService.getVipPlans();
    return { code: 0, data: { list, total: list.length, page: 1, size: list.length } };
  }

  @Post('vip-plans')
  @ApiOperation({ summary: '创建VIP套餐' })
  async createVipPlan(@Body() body: any) {
    return { code: 0, data: await this.adminService.createVipPlan(body) };
  }

  @Put('vip-plans/:id')
  @ApiOperation({ summary: '更新VIP套餐' })
  async updateVipPlan(@Param('id') id: string, @Body() body: any) {
    return { code: 0, data: await this.adminService.updateVipPlan(+id, body) };
  }

  @Delete('vip-plans/:id')
  @ApiOperation({ summary: '删除VIP套餐' })
  async deleteVipPlan(@Param('id') id: string) {
    await this.adminService.deleteVipPlan(+id);
    return { code: 0, data: { success: true } };
  }

  @Put('vip-plans/:id/status')
  @ApiOperation({ summary: '切换VIP套餐状态' })
  async toggleVipPlanStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return { code: 0, data: await this.adminService.toggleVipPlanStatus(+id, body.status) };
  }

  // ============== 消息管理 ==============
  @Get('notifications')
  @ApiOperation({ summary: '消息列表' })
  async getNotifications(@Query() query: any) {
    return this.adminService.getNotifications(query);
  }

  @Post('notifications')
  @ApiOperation({ summary: '发送通知' })
  async createNotification(@Body() body: any) {
    return this.adminService.createNotification(body);
  }
}
