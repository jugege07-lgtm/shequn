import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  /** 获取用户余额 */
  async getUserBalance(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      balance: Number((user?.balance ?? 0).toFixed(2)),
    };
  }

  /** 充值 - 直接入账并生成充值记录（模拟支付成功） */
  async recharge(userId: number, amount: number) {
    const amt = Number(amount);
    if (!amt || isNaN(amt)) throw new BadRequestException('充值金额无效');
    if (amt <= 0) throw new BadRequestException('充值金额必须大于0');
    if (amt > 100000) throw new BadRequestException('单次充值金额不能超过 100000 元');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const newBalance = Math.round(((user.balance ?? 0) + amt) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      }),
      this.prisma.balanceLog.create({
        data: {
          userId,
          type: 'recharge',
          amount: amt,
          balance: newBalance,
          remark: '账户充值',
        },
      }),
    ]);

    return { balance: newBalance, amount: amt, type: 'recharge' };
  }

  /**
   * 商机收益入账
   * 付费商机成交后，将成交金额的 70%（ratio）作为收益发放至发布者余额。
   */
  async addBusinessIncome(userId: number, business: { id: number; title: string; unlockFee: number }, ratio = 0.7) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const dealAmount = Number((business.unlockFee ?? 0).toFixed(2));
    const income = Math.round(dealAmount * ratio * 100) / 100;
    if (income <= 0) return null;

    const newBalance = Math.round(((user.balance ?? 0) + income) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      }),
      this.prisma.balanceLog.create({
        data: {
          userId,
          type: 'income',
          amount: income,
          balance: newBalance,
          businessId: business.id,
          businessTitle: business.title,
          dealAmount,
          ratio,
          remark: `商机成交收益（${business.title}）`,
        },
      }),
    ]);

    return { balance: newBalance, income, type: 'income' };
  }

  /** 获取用户余额明细 */
  async getUserBalanceLogs(userId: number, params?: { page?: number; size?: number; type?: string }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = { userId };
    if (params?.type && params.type !== 'all') {
      where.type = params.type;
    }

    const [list, total] = await Promise.all([
      this.prisma.balanceLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.balanceLog.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 获取所有余额明细（管理端） */
  async getAllBalanceLogs(params?: {
    page?: number;
    size?: number;
    userId?: number | string;
    type?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = {};
    if (params?.userId) where.userId = Number(params.userId);
    if (params?.type) where.type = params.type;
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }
    if (params?.keyword) {
      where.user = {
        OR: [
          { nickname: { contains: params.keyword } },
          { phone: { contains: params.keyword } },
        ],
      };
    }

    const [list, total] = await Promise.all([
      this.prisma.balanceLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, nickname: true, phone: true, avatarUrl: true } } },
      }),
      this.prisma.balanceLog.count({ where }),
    ]);
    return { list, total, page, size };
  }
}