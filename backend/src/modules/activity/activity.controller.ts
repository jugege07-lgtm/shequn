import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('活动')
@Controller('api')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('public/activities')
  @ApiOperation({ summary: '获取活动列表（公开）' })
  async getPublicActivities(@Query() query: any) {
    return { code: 0, data: await this.activityService.getPublicActivities(query) };
  }

  @Get('public/activity-types')
  @ApiOperation({ summary: '获取活动分类列表（移动端与管理端共用）' })
  async getActivityTypes() {
    return { code: 0, data: this.activityService.getActivityTypes() };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('activities/signed')
  @ApiOperation({ summary: '获取已报名活动列表' })
  async getSignedActivities(@CurrentUser() user: any, @Query() query: any) {
    return { code: 0, data: await this.activityService.getSignedActivities(user.userId, query) };
  }

  @Get('public/activities/:id')
  @ApiOperation({ summary: '获取活动详情（公开）' })
  async getActivityDetail(@Param('id') id: string) {
    return { code: 0, data: await this.activityService.getActivityDetail(Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activities')
  @ApiOperation({ summary: '创建活动' })
  async createActivity(@Body() dto: CreateActivityDto, @CurrentUser() user: any) {
    return { code: 0, data: await this.activityService.createActivity(dto, user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('activities/my')
  @ApiOperation({ summary: '获取我的活动' })
  async getMyActivities(@CurrentUser() user: any, @Query() query: any) {
    return { code: 0, data: await this.activityService.getMyActivities(user.userId, query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('activities/:id/signup-status')
  @ApiOperation({ summary: '获取当前用户活动报名状态' })
  async getSignupStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.activityService.getSignupStatus(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activities/:id/signup')
  @ApiOperation({ summary: '报名活动' })
  async signupActivity(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.activityService.signupActivity(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activities/:id/view')
  @ApiOperation({ summary: '记录活动浏览量' })
  async recordView(@Param('id') id: string) {
    return { code: 0, data: await this.activityService.recordView(Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('activities/:id/favorite-status')
  @ApiOperation({ summary: '获取当前用户活动收藏状态' })
  async getFavoriteStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.activityService.getFavoriteStatus(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activities/:id/favorite')
  @ApiOperation({ summary: '收藏 / 取消收藏活动' })
  async toggleFavorite(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.activityService.toggleFavorite(Number(id), user.userId) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activities/:id/verify')
  @ApiOperation({ summary: '扫码核销报名' })
  async verifySignup(
    @Param('id') id: string,
    @Body('token') token: string,
    @CurrentUser() user: any,
  ) {
    return { code: 0, data: await this.activityService.verifySignup(Number(id), token, user.userId) };
  }
}
