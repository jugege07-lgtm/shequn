import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VipService } from './vip.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('VIP')
@Controller('api/vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('plans')
  @ApiOperation({ summary: '获取VIP套餐列表（公开）' })
  async getPlans() {
    return this.vipService.getPlans();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiOperation({ summary: '订阅VIP' })
  async subscribe(@Body('planId') planId: number, @CurrentUser() user: any) {
    return this.vipService.subscribe(user.userId, planId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('subscriptions')
  @ApiOperation({ summary: '获取我的VIP订阅记录' })
  async getSubscriptions(@CurrentUser() user: any) {
    return this.vipService.getSubscriptions(user.userId);
  }
}
