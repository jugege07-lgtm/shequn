import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('优惠券')
@Controller('api')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // ===== 公开接口 =====
  // 注意:JwtAuthGuard 失败时仍允许匿名访问,但拿不到 userId,
  // 此时 list 项里的 userClaimed/userClaimCount 默认为 0,前端显示「可领取」。
  @Get('public/coupons')
  @ApiOperation({ summary: '获取优惠券列表（公开）' })
  async getPublicCoupons(@Query() query: any, @CurrentUser() _user: any) {
    const userId = _user?.userId ? Number(_user.userId) : undefined;
    return { code: 0, data: await this.couponService.getCoupons({ ...query, userId }) };
  }

  @Get('public/coupons/:id')
  @ApiOperation({ summary: '获取优惠券详情（公开）' })
  async getCouponDetail(@Param('id') id: string) {
    return { code: 0, data: await this.couponService.getCoupon(Number(id)) };
  }

  // ===== 用户接口 =====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('coupons/claim/:id')
  @ApiOperation({ summary: '领取优惠券' })
  async claimCoupon(@Param('id') id: string, @CurrentUser() user: any) {
    return { code: 0, data: await this.couponService.claimCoupon(user.userId, Number(id)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('coupons/my')
  @ApiOperation({ summary: '获取我的优惠券' })
  async getMyCoupons(@CurrentUser() user: any, @Query() query: any) {
    return { code: 0, data: await this.couponService.getUserCoupons(user.userId, query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('coupons/:id/use')
  @ApiOperation({ summary: '使用优惠券（标记已使用）' })
  async useCoupon(@Param('id') id: string, @Body('orderNo') orderNo: string, @CurrentUser() _user: any) {
    return { code: 0, data: await this.couponService.useCoupon(Number(id), orderNo) };
  }

  // ===== 管理端接口（需要 admin 角色）=====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Get('admin/coupons')
  @ApiOperation({ summary: '获取所有优惠券（管理端）' })
  async getAllCoupons(@Query() query: any) {
    return { code: 0, data: await this.couponService.getAllCoupons(query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Post('admin/coupons')
  @ApiOperation({ summary: '创建优惠券' })
  async createCoupon(@Body() data: any) {
    return { code: 0, data: await this.couponService.createCoupon(data) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Put('admin/coupons/:id')
  @ApiOperation({ summary: '更新优惠券' })
  async updateCoupon(@Param('id') id: string, @Body() data: any) {
    return { code: 0, data: await this.couponService.updateCoupon(Number(id), data) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Delete('admin/coupons/:id')
  @ApiOperation({ summary: '删除优惠券' })
  async deleteCoupon(@Param('id') id: string) {
    await this.couponService.deleteCoupon(Number(id));
    return { code: 0, data: { success: true } };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Get('admin/coupons/records')
  @ApiOperation({ summary: '获取领取记录' })
  async getClaimRecords(@Query() query: any) {
    return { code: 0, data: await this.couponService.getClaimRecords(query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Post('admin/coupons/assign')
  @ApiOperation({ summary: '后台精准发放' })
  async assignCoupon(@Body('couponId') couponId: number, @Body('userIds') userIds: number[]) {
    return { code: 0, data: await this.couponService.batchAssign(couponId, userIds) };
  }
}
