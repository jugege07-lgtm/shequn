import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('余额')
@Controller('api')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  // ===== 用户接口 =====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('balance/my')
  @ApiOperation({ summary: '获取我的余额' })
  async getMyBalance(@CurrentUser() user: any) {
    return this.balanceService.getUserBalance(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('balance/my/logs')
  @ApiOperation({ summary: '获取我的余额明细' })
  async getMyBalanceLogs(@CurrentUser() user: any, @Query() query: any) {
    return this.balanceService.getUserBalanceLogs(user.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('balance/recharge')
  @ApiOperation({ summary: '余额充值' })
  async recharge(@CurrentUser() user: any, @Body('amount') amount: number) {
    return this.balanceService.recharge(user.userId, Number(amount));
  }

  // ===== 管理端接口（需要 admin / operator 角色）=====
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Get('admin/balance-logs')
  @ApiOperation({ summary: '获取所有余额明细' })
  async getAllBalanceLogs(@Query() query: any) {
    return { code: 0, data: await this.balanceService.getAllBalanceLogs(query) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @Post('admin/balance/adjust')
  @ApiOperation({ summary: '调整用户余额（直接设置/增加/扣减）' })
  async adjustBalance(
    @Body() body: { userId: number; type?: string; amount?: number; remark?: string },
  ) {
    if (!body.userId) {
      return { code: 1, message: '缺少用户ID' };
    }
    return {
      code: 0,
      data: await this.balanceService.adjustBalance(Number(body.userId), {
        type: body.type,
        amount: body.amount,
        remark: body.remark,
      }),
    };
  }
}