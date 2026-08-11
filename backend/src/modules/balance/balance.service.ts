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

  /** 创建余额充值订单（待支付），需通过微信支付完成充值 */
  async createRechargeOrder(userId: number, amount: number) {
    const amt = Number(amount);
    if (!amt || isNaN(amt)) throw new BadRequestException('充值金额无效');
    if (amt <= 0) throw new BadRequestException('充值金额必须大于0');
    if (amt > 100000) throw new BadRequestException('单次充值金额不能超过 100000 元');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const orderNo = `RECHARGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId,
        orderType: 'recharge',
        totalAmount: amt,
        discountAmount: 0,
        payAmount: amt,
        status: 'pending_payment',
        remark: '余额充值',
      },
    });

    return { orderId: order.id, orderNo: order.orderNo, payAmount: order.payAmount };
  }

  /** 微信支付成功后，将充值金额入账（幂等） */
  async fulfillRecharge(orderNo: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order || order.orderType !== 'recharge' || order.status !== 'paid') return null;

    // 幂等：该订单已有充值记录则跳过，避免微信回调重复入账
    const existing = await this.prisma.balanceLog.findFirst({
      where: { userId: order.userId, type: 'recharge', remark: `余额充值 ${order.orderNo}` },
    });
    if (existing) return { balance: Number(existing.balance), amount: order.payAmount };

    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    const newBalance = Math.round(((user?.balance ?? 0) + order.payAmount) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: order.userId },
        data: { balance: newBalance },
      }),
      this.prisma.balanceLog.create({
        data: {
          userId: order.userId,
          type: 'recharge',
          amount: order.payAmount,
          balance: newBalance,
          remark: `余额充值 ${order.orderNo}`,
        },
      }),
    ]);

    return { balance: newBalance, amount: order.payAmount };
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

  /**
   * 管理员调整余额（管理端）
   * type: 'set'=直接设置 | 'add'=增加 | 'subtract'=扣减
   */
  async adjustBalance(
    userId: number,
    params: { type?: string; amount?: number; remark?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const type = params?.type || 'set';
    const input = Number(params?.amount);
    if (isNaN(input) || input < 0) {
      throw new BadRequestException('金额无效');
    }

    const oldBalance = user.balance ?? 0;
    let newBalance: number;
    if (type === 'set') {
      newBalance = Math.round(input * 100) / 100;
    } else if (type === 'add') {
      newBalance = Math.round((oldBalance + input) * 100) / 100;
    } else if (type === 'subtract') {
      newBalance = Math.round((oldBalance - input) * 100) / 100;
      if (newBalance < 0) {
        throw new BadRequestException('余额不足以扣减，当前余额不足以扣除该金额');
      }
    } else {
      throw new BadRequestException('操作类型无效，仅支持 set / add / subtract');
    }

    const delta = Math.round((newBalance - oldBalance) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      }),
      this.prisma.balanceLog.create({
        data: {
          userId,
          type: 'adjust',
          amount: delta,
          balance: newBalance,
          remark: params?.remark || '管理员调整余额',
        },
      }),
    ]);

    return { balance: newBalance, delta, type };
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