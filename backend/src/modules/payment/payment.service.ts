import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { SystemService } from '../system/system.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BusinessService } from '../business/business.service';
import { VipService } from '../vip/vip.service';
import { UserService } from '../user/user.service';
import * as fs from 'fs';
import WxPay = require('wechatpay-node-v3');

export interface PaymentConfig {
  channel: string;
  wxAppId: string;
  wxSecret: string;
  wxMchId: string;
  wxApiKey: string;
  wxNotifyUrl: string;
  wxRefundNotifyUrl: string;
  wxCertPath: string;
  wxCertKeyPath: string;
  wxP12Path: string;
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  alipayNotifyUrl: string;
}

const KEY_MAP: Record<keyof PaymentConfig, string> = {
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

function toFen(yuan: number): number {
  return Math.round(Math.round(yuan * 100 * 100) / 100);
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly systemService: SystemService,
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly businessService: BusinessService,
    private readonly vipService: VipService,
    private readonly userService: UserService,
  ) {}

  async getPaymentConfig(): Promise<PaymentConfig> {
    const config: any = {};
    for (const field of Object.keys(KEY_MAP) as (keyof PaymentConfig)[]) {
      config[field] = (await this.systemService.getConfig(KEY_MAP[field])) || '';
    }
    return config as PaymentConfig;
  }

  async validateConfig(): Promise<{ valid: boolean; message: string }> {
    const config = await this.getPaymentConfig();
    if (!config.channel) {
      return { valid: false, message: '未配置支付渠道' };
    }
    if (config.channel === 'wechat') {
      const required = [config.wxAppId, config.wxSecret, config.wxMchId, config.wxApiKey, config.wxNotifyUrl, config.wxRefundNotifyUrl, config.wxCertPath, config.wxCertKeyPath];
      if (required.some((v) => !v)) {
        return { valid: false, message: '微信支付配置不完整' };
      }
      try {
        if (!fs.existsSync(config.wxCertPath)) {
          return { valid: false, message: `微信支付证书文件不存在: ${config.wxCertPath}` };
        }
        if (!fs.existsSync(config.wxCertKeyPath)) {
          return { valid: false, message: `微信支付证书私钥文件不存在: ${config.wxCertKeyPath}` };
        }
      } catch {
        // 文件系统检查失败时继续，避免影响 mock 模式
      }
    }
    if (config.channel === 'alipay') {
      if (!config.alipayAppId || !config.alipayPrivateKey || !config.alipayPublicKey || !config.alipayNotifyUrl) {
        return { valid: false, message: '支付宝配置不完整' };
      }
    }
    return { valid: true, message: '配置校验通过' };
  }

  private async getWxPay() {
    const config = await this.getPaymentConfig();
    if (config.channel !== 'wechat') {
      throw new BadRequestException('当前仅支持微信支付');
    }
    const { valid, message } = await this.validateConfig();
    if (!valid) {
      throw new BadRequestException(message);
    }
    return new WxPay({
      appid: config.wxAppId,
      mchid: config.wxMchId,
      publicKey: fs.readFileSync(config.wxCertPath),
      privateKey: fs.readFileSync(config.wxCertKeyPath),
      key: config.wxApiKey,
    });
  }

  async createUnifiedOrder(params: {
    orderNo: string;
    amount: number;
    description: string;
    openid: string;
    clientIp: string;
    channel?: string;
  }) {
    const { orderNo, amount, description, openid, clientIp } = params;

    if (!openid || openid.startsWith('mock_') || openid.startsWith('phone_') || openid.startsWith('admin_')) {
      throw new BadRequestException('当前用户未通过微信授权，无法发起微信支付');
    }

    const wxpay = await this.getWxPay();
    const config = await this.getPaymentConfig();

    try {
      const result: any = await wxpay.transactions_jsapi({
        description,
        out_trade_no: orderNo,
        notify_url: config.wxNotifyUrl,
        amount: {
          total: toFen(amount),
          currency: 'CNY',
        },
        payer: {
          openid,
        },
        scene_info: {
          payer_client_ip: clientIp || '127.0.0.1',
        },
      });

      return {
        channel: 'wechat',
        appId: result.appId,
        timeStamp: result.timeStamp,
        nonceStr: result.nonceStr,
        package: result.package,
        signType: result.signType,
        paySign: result.paySign,
      };
    } catch (err: any) {
      this.logger.error('微信支付统一下单失败', err?.message || err);
      throw new BadRequestException(err?.message || '微信支付下单失败');
    }
  }

  /**
   * 余额支付：校验支付密码后扣减用户余额并标记订单已支付（事务一致），随后触发业务履约
   */
  async payWithBalance(userId: number, orderNo: string, payPassword?: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('订单不存在');
    }
    if (order.status !== 'pending_payment') {
      throw new BadRequestException('订单状态异常，无法支付');
    }

    // 校验支付密码
    if (!payPassword) {
      throw new BadRequestException('请输入支付密码');
    }
    const has = await this.userService.hasPayPassword(userId);
    if (!has) {
      throw new BadRequestException('尚未设置支付密码，请先前往设置');
    }
    const ok = await this.userService.verifyPayPassword(userId, payPassword);
    if (!ok) {
      throw new BadRequestException('支付密码错误');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const balance = user?.balance ?? 0;
    if (balance < order.payAmount) {
      throw new BadRequestException(
        `余额不足，当前余额 ¥${Number(balance).toFixed(2)}，需支付 ¥${Number(order.payAmount).toFixed(2)}`,
      );
    }

    const newBalance = Math.round((balance - order.payAmount) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      }),
      this.prisma.order.update({
        where: { orderNo },
        data: {
          status: 'paid',
          paidAt: new Date(),
          transactionId: `BAL_${order.orderNo}`,
        },
      }),
      this.prisma.balanceLog.create({
        data: {
          userId,
          type: 'payment',
          amount: -order.payAmount,
          balance: newBalance,
          remark: this.orderPaymentRemark(order),
        },
      }),
    ]);

    await this.fulfillOrder(order);
    return { balance: newBalance, paidAmount: order.payAmount, orderNo };
  }

  /** 余额支付流水备注 */
  private orderPaymentRemark(order: any): string {
    if (order.orderType === 'activity_signup') return '余额支付 · 活动报名';
    if (order.orderType === 'business_unlock') return '余额支付 · 商机解锁';
    if (order.orderType === 'vip') return '余额支付 · VIP会员开通';
    return '余额支付 · 商城购物';
  }

  /**
   * 处理微信支付结果通知
   */
  async handleWechatNotify(headers: Record<string, string | string[] | undefined>, rawBody: Buffer | string) {
    const wxpay = await this.getWxPay();
    const config = await this.getPaymentConfig();

    const signature = this.getHeader(headers, 'wechatpay-signature');
    const serial = this.getHeader(headers, 'wechatpay-serial');
    const nonce = this.getHeader(headers, 'wechatpay-nonce');
    const timestamp = this.getHeader(headers, 'wechatpay-timestamp');

    if (!signature || !serial || !nonce || !timestamp) {
      throw new UnauthorizedException('微信支付回调缺少必要头信息');
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

    const verified = await wxpay.verifySign({
      apiSecret: config.wxApiKey,
      body: bodyStr,
      signature,
      serial,
      nonce,
      timestamp,
    });

    if (!verified) {
      throw new UnauthorizedException('微信支付回调验签失败');
    }

    const notify = JSON.parse(bodyStr);
    const { ciphertext, associated_data, nonce: dataNonce } = notify.resource || {};
    if (!ciphertext || !dataNonce) {
      throw new BadRequestException('微信支付回调数据格式异常');
    }

    const plainText = wxpay.decipher_gcm(ciphertext, associated_data || '', dataNonce, config.wxApiKey) as string;
    const data = JSON.parse(plainText);
    this.logger.log(`微信支付成功通知: out_trade_no=${data.out_trade_no}, transaction_id=${data.transaction_id}`);

    await this.markOrderPaid(data.out_trade_no, data.transaction_id, data.success_time ? new Date(data.success_time) : new Date());

    return { code: 'SUCCESS', message: 'OK' };
  }

  /**
   * 标记订单为已支付并触发业务履约
   */
  async markOrderPaid(orderNo: string, transactionId?: string, paidAt?: Date) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order || order.status !== 'pending_payment') {
      this.logger.warn(`订单 ${orderNo} 不存在或状态非待支付，跳过履约`);
      return;
    }

    await this.prisma.order.update({
      where: { orderNo },
      data: {
        status: 'paid',
        paidAt: paidAt || new Date(),
        transactionId: transactionId || order.transactionId,
      },
    });

    // 根据订单类型触发业务状态联动
    await this.fulfillOrder(order);
  }

  /**
   * 根据订单类型完成业务履约
   */
  private async fulfillOrder(order: { orderNo: string; orderType: string }) {
    try {
      if (order.orderType === 'activity_signup') {
        await this.activityService.fulfillActivitySignup(order.orderNo);
      } else if (order.orderType === 'business_unlock') {
        await this.businessService.fulfillBusinessUnlock(order.orderNo);
      } else if (order.orderType === 'product') {
        // 商品订单：若使用积分抵扣（积分+现金组合支付），支付成功后扣减积分并写明细
        const o = await this.prisma.order.findUnique({ where: { orderNo: order.orderNo } });
        if (o && o.pointsUsed > 0) {
          await this.deductPointsForPaidOrder(o);
        }
      } else if (order.orderType === 'vip') {
        await this.vipService.fulfillVip(order.orderNo);
      }
      // product 类型订单无需额外履约，订单状态已更新
    } catch (err: any) {
      this.logger.error(`订单履约失败: ${order.orderNo}`, err?.message || err);
      // 不抛异常，避免影响微信回调返回 SUCCESS
    }
  }

  /**
   * 组合支付订单支付成功后扣积分 + 写明细（事务一致）
   */
  private async deductPointsForPaidOrder(order: { userId: number; pointsUsed: number; orderNo: string }) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      const balance = (user?.points ?? 0) - order.pointsUsed;
      if (balance < 0) {
        throw new BadRequestException(
          `积分不足，当前 ${user?.points ?? 0} 积分，需要 ${order.pointsUsed} 积分`,
        );
      }
      const item = await tx.orderItem.findFirst({
        where: { orderId: (await tx.order.findUnique({ where: { orderNo: order.orderNo } }))!.id },
        select: { productName: true },
      });
      await tx.user.update({
        where: { id: order.userId },
        data: { points: balance },
      });
      await tx.pointLog.create({
        data: {
          userId: order.userId,
          action: 'product_exchange',
          points: -order.pointsUsed,
          balance,
          remark: `积分+现金购买商品${item?.productName ? `「${item.productName}」` : ''}，消耗 ${order.pointsUsed} 积分`,
        },
      });
    });
  }

  /**
   * 处理微信退款结果通知
   */
  async handleWechatRefundNotify(headers: Record<string, string | string[] | undefined>, rawBody: Buffer | string) {
    const wxpay = await this.getWxPay();
    const config = await this.getPaymentConfig();

    const signature = this.getHeader(headers, 'wechatpay-signature');
    const serial = this.getHeader(headers, 'wechatpay-serial');
    const nonce = this.getHeader(headers, 'wechatpay-nonce');
    const timestamp = this.getHeader(headers, 'wechatpay-timestamp');

    if (!signature || !serial || !nonce || !timestamp) {
      throw new UnauthorizedException('微信退款回调缺少必要头信息');
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    const verified = await wxpay.verifySign({
      apiSecret: config.wxApiKey,
      body: bodyStr,
      signature,
      serial,
      nonce,
      timestamp,
    });

    if (!verified) {
      throw new UnauthorizedException('微信退款回调验签失败');
    }

    const notify = JSON.parse(bodyStr);
    const { ciphertext, associated_data, nonce: dataNonce } = notify.resource || {};
    if (!ciphertext || !dataNonce) {
      throw new BadRequestException('微信退款回调数据格式异常');
    }

    const plainText = wxpay.decipher_gcm(ciphertext, associated_data || '', dataNonce, config.wxApiKey) as string;
    const data = JSON.parse(plainText);
    this.logger.log(`微信退款通知: out_refund_no=${data.out_refund_no}, status=${data.refund_status}`);

    const refundRecord = await this.prisma.refund.findFirst({ where: { order: { orderNo: data.out_trade_no } }, include: { order: true } });
    if (refundRecord && data.refund_status === 'SUCCESS') {
      await this.prisma.order.update({ where: { id: refundRecord.orderId }, data: { status: 'refunded' } });
      await this.prisma.refund.update({ where: { id: refundRecord.id }, data: { status: 'approved', processedAt: new Date() } });
    }

    return { code: 'SUCCESS', message: 'OK' };
  }

  /**
   * 申请微信退款
   */
  async refund(order: { orderNo: string; payAmount: number; status: string }, refund: { refundAmount: number; reason?: string }) {
    if (order.status !== 'paid') {
      throw new BadRequestException('订单未支付，无法退款');
    }

    const wxpay = await this.getWxPay();
    const outRefundNo = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await wxpay.refunds({
        out_trade_no: order.orderNo,
        out_refund_no: outRefundNo,
        reason: refund.reason || '用户申请退款',
        amount: {
          refund: toFen(refund.refundAmount),
          total: toFen(order.payAmount),
          currency: 'CNY',
        },
      });
      return { success: true, outRefundNo, result };
    } catch (err: any) {
      this.logger.error('微信退款申请失败', err?.message || err);
      throw new BadRequestException(err?.message || '微信退款申请失败');
    }
  }

  /**
   * 查询微信支付订单状态
   */
  async queryWechatOrder(orderNo: string) {
    const wxpay = await this.getWxPay();
    try {
      return await wxpay.query({ out_trade_no: orderNo });
    } catch (err: any) {
      this.logger.error('微信订单查询失败', err?.message || err);
      throw new BadRequestException(err?.message || '微信订单查询失败');
    }
  }

  private getHeader(headers: Record<string, string | string[] | undefined>, key: string): string | undefined {
    const value = headers[key.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
