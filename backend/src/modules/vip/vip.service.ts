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

    const subscription = await this.prisma.vipSubscription.create({
      data: {
        userId,
        planId,
        orderNo,
        payAmount: plan.currentPrice,
        startAt,
        expireAt,
        status: 'active',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        vipLevel: plan.level,
        vipExpireAt: expireAt,
      },
    });

    return subscription;
  }

  async getSubscriptions(userId: number) {
    return this.prisma.vipSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }
}
