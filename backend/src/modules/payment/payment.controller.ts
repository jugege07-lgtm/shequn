import { Controller, Post, Body, Param, UseGuards, NotFoundException, BadRequestException, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('支付')
@Controller('api/pay')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('unified-order')
  @ApiOperation({ summary: '创建统一支付订单（获取调起参数）' })
  async createUnifiedOrder(
    @CurrentUser() user: any,
    @Body() body: { orderId: number },
    @Req() req: RawBodyRequest,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      include: { items: true },
    });
    if (!order || order.userId !== Number(user.userId)) {
      throw new NotFoundException('订单不存在');
    }
    if (order.status !== 'pending_payment') {
      throw new BadRequestException('订单状态异常');
    }

    const payer = await this.prisma.user.findUnique({ where: { id: order.userId }, select: { openid: true } });
    if (!payer?.openid) {
      throw new BadRequestException('用户未绑定微信 openid，无法发起微信支付');
    }

    const clientIp = this.extractClientIp(req);
    const result = await this.paymentService.createUnifiedOrder({
      orderNo: order.orderNo,
      amount: order.payAmount,
      description: order.items.map((i) => i.productName).join(',').slice(0, 127) || '商品订单',
      openid: payer.openid,
      clientIp,
    });
    return { code: 0, data: result };
  }

  @Post('wechat/notify')
  @ApiOperation({ summary: '微信支付结果通知（公开）' })
  async handleWechatNotify(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: RawBodyRequest,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('缺少回调原始报文');
    }
    return { code: 0, data: await this.paymentService.handleWechatNotify(headers, rawBody) };
  }

  @Post('wechat/refund-notify')
  @ApiOperation({ summary: '微信退款结果通知（公开）' })
  async handleWechatRefundNotify(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: RawBodyRequest,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('缺少回调原始报文');
    }
    return { code: 0, data: await this.paymentService.handleWechatRefundNotify(headers, rawBody) };
  }

  @Post('query/:orderNo')
  @ApiOperation({ summary: '查询微信支付订单状态' })
  async queryWechatOrder(@Param('orderNo') orderNo: string) {
    return { code: 0, data: await this.paymentService.queryWechatOrder(orderNo) };
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0].trim();
    }
    return req.ip || '127.0.0.1';
  }
}
