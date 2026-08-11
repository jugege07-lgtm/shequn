import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class VipService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.vipPlan.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async subscribe(userId: number, planId: number) {
    const plan = await this.prisma.vipPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.status !== 1) {
      throw new Error('VIP套餐不存在或已下架');
    }

    const orderNo = `VIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startAt = new Date();
    const expireAt = new Date(startAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // 创建待支付订单 + 待支付订阅记录，交由统一支付流程履约
    const [order, subscription] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'vip',
          totalAmount: plan.currentPrice,
          discountAmount: 0,
          payAmount: plan.currentPrice,
          status: 'pending_payment',
          remark: `VIP开通: ${plan.name}`,
        },
      }),
      this.prisma.vipSubscription.create({
        data: {
          userId,
          planId,
          orderNo,
          payAmount: plan.currentPrice,
          startAt,
          expireAt,
          status: 'pending_payment',
        },
      }),
    ]);

    return {
      subscription,
      order: { id: order.id, orderNo: order.orderNo },
      needPay: true,
    };
  }

  /** 支付成功后履约：激活 VIP 订阅并更新用户 VIP 等级/有效期 */
  async fulfillVip(orderNo: string) {
    const subscription = await this.prisma.vipSubscription.findFirst({
      where: { orderNo },
    });
    if (!subscription || subscription.status === 'active') return;

    const plan = await this.prisma.vipPlan.findUnique({
      where: { id: subscription.planId },
    });
    if (!plan) return;

    const startAt = new Date();
    const expireAt = new Date(startAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.vipSubscription.update({
        where: { id: subscription.id },
        data: { status: 'active', startAt, expireAt },
      }),
      this.prisma.user.update({
        where: { id: subscription.userId },
        data: { vipLevel: plan.level, vipExpireAt: expireAt },
      }),
    ]);
  }

  async getSubscriptions(userId: number) {
    return this.prisma.vipSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }
}
