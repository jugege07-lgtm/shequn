import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointService } from './point.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('积分')
@Controller('api')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  // ===== 公开接口 =====
  @Get('public/point-rules')
  @ApiOperation({ summary: '获取积分规则列表（公开）' })
  async getPublicRules(@Query() query: any) {
    return this.pointService.getRules({ ...query, page: parseInt(String(query.page ?? 1), 10) || 1, size: parseInt(String(query.size ?? 20), 10) || 20 });
  }

  // ===== 用户接口 =====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('points/my')
  @ApiOperation({ summary: '获取我的积分' })
  async getMyPoints(@CurrentUser() user: any) {
    return this.pointService.getUserPoints(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('points/my/logs')
  @ApiOperation({ summary: '获取我的积分明细' })
  async getMyPointLogs(@CurrentUser() user: any, @Query() query: any) {
    return this.pointService.getUserPointLogs(user.userId, query);
  }

  // ===== 管理端接口（需要 admin 角色）=====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/point-rules')
  @ApiOperation({ summary: '获取所有积分规则' })
  async getAllRules(@Query() query: any) {
    return { code: 0, data: await this.pointService.getRules(query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/point-rules/all')
  @ApiOperation({ summary: '获取所有积分规则（不分页，用于下拉选择）' })
  async getAllRulesFlat() {
    return { code: 0, data: await this.pointService.getAllRules() };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/point-rules')
  @ApiOperation({ summary: '创建积分规则' })
  async createRule(@Body() data: any) {
    return { code: 0, data: await this.pointService.createRule(data) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/point-rules/:id')
  @ApiOperation({ summary: '更新积分规则' })
  async updateRule(@Param('id') id: string, @Body() data: any) {
    return { code: 0, data: await this.pointService.updateRule(Number(id), data) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/point-rules/:id')
  @ApiOperation({ summary: '删除积分规则' })
  async deleteRule(@Param('id') id: string) {
    await this.pointService.deleteRule(Number(id));
    return { code: 0, data: { success: true } };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/point-rules/sort-orders')
  @ApiOperation({ summary: '批量更新排序权重（拖拽排序）' })
  async updateSortOrders(@Body('updates') updates: { id: number; sortOrder: number }[]) {
    return { code: 0, data: await this.pointService.updateSortOrders(updates) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/point-rules/priorities')
  @ApiOperation({ summary: '批量更新优先级（拖拽排序）' })
  async updatePriorities(@Body('updates') updates: { id: number; priority: number }[]) {
    return { code: 0, data: await this.pointService.updatePriorities(updates) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/point-logs')
  @ApiOperation({ summary: '获取所有积分明细' })
  async getAllLogs(@Query() query: any) {
    return { code: 0, data: await this.pointService.getAllPointLogs(query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/points/adjust')
  @ApiOperation({ summary: '手动调整用户积分' })
  async adjustPoints(@Body('userId') userId: number, @Body('points') points: number, @Body('remark') remark: string) {
    return { code: 0, data: await this.pointService.adjustPoints(Number(userId), Number(points), remark) };
  }
}
