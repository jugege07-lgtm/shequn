import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PointService } from '../point/point.service';
import { BalanceService } from '../balance/balance.service';

/** 商机收益分成比例：成交金额的 70% 发放给发布者 */
const BUSINESS_INCOME_RATIO = 0.7;

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
    private balanceService: BalanceService,
  ) {}

  async getPublicBusinesses(params?: { page?: number; size?: number; status?: string; categoryId?: string | number }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    const status = params?.status;
    const where: any = { status: 'approved' };
    if (status && status !== 'all') where.status = status;
    if (params?.categoryId) where.categoryId = Number(params.categoryId);

    const [list, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          publisher: { select: { nickname: true, avatarUrl: true } },
          category: { select: { id: true, name: true, code: true, icon: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getBusinessCategories() {
    return this.prisma.businessCategory.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, code: true, icon: true, sortOrder: true },
    });
  }

  async createBusiness(dto: any, publisherId: number) {
    const business = await this.prisma.business.create({
      data: {
        title: dto.title,
        coverImage: dto.coverImage || '',
        description: dto.description,
        categoryId: Number(dto.categoryId),
        contactName: dto.contactName,
        contactPhone: dto.contactPhone ?? '',
        contactWechat: dto.contactWechat ?? '',
        unlockFee: Number(dto.unlockFee ?? 0),
        maxUnlocks: Number(dto.maxUnlocks ?? 3),
        status: 'pending',
        publisherId,
      },
    });

    try {
      await this.pointService.awardPoints(publisherId, 'publish_business', '发布商机');
    } catch (err) {
      console.error('发布商机积分发放失败:', err);
    }

    return business;
  }

  async getBusinessDetail(id: number) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, avatarUrl: true } },
        unlocks: true,
      },
    });
  }

  async getUnlockStatus(businessId: number, userId: number) {
    const unlock = await this.prisma.businessUnlock.findFirst({
      where: { businessId, userId },
    });
    return {
      isUnlocked: !!unlock && unlock.feePaid > 0,
      feePaid: unlock?.feePaid ?? 0,
      orderNo: unlock?.orderNo ?? null,
    };
  }

  async unlockBusiness(businessId: number, userId: number) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('商机不存在');
    if (business.status !== 'approved') throw new BadRequestException('商机未通过审核，无法解锁');
    if (business.currentUnlocks >= business.maxUnlocks) throw new ForbiddenException('已达到最大解锁次数');

    const existing = await this.prisma.businessUnlock.findFirst({
      where: { businessId, userId },
    });
    if (existing && existing.feePaid > 0) {
      return { unlock: existing, needPay: false, message: '您已解锁该商机' };
    }

    // 已创建待支付订单：返回待支付订单，避免重复创建
    if (existing && existing.feePaid === 0 && business.unlockFee > 0) {
      const order = await this.prisma.order.findFirst({
        where: { businessId, userId, orderType: 'business_unlock', status: 'pending_payment' },
      });
      if (order) {
        return { unlock: existing, order: { id: order.id, orderNo: order.orderNo }, needPay: true };
      }
    }

    // 免费商机直接解锁
    if (!business.unlockFee || business.unlockFee <= 0) {
      // 校验免费商机解锁次数上限（普通会员 / 各VIP等级差异化）
      await this.checkFreeUnlockLimit(userId);

      const orderNo = `BIZ_FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const unlock = await this.prisma.businessUnlock.create({
        data: {
          businessId,
          userId,
          feePaid: 0,
          orderNo,
        },
      });

      await this.prisma.business.update({
        where: { id: businessId },
        data: { currentUnlocks: { increment: 1 } },
      });

      try {
        await this.pointService.awardPoints(userId, 'unlock_business', '解锁商机');
      } catch (err) {
        console.error('解锁商机积分发放失败:', err);
      }

      return { unlock, needPay: false };
    }

    // 收费商机：创建待支付订单 + 待解锁记录
    const orderNo = `BIZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [order, unlock] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'business_unlock',
          totalAmount: business.unlockFee,
          discountAmount: 0,
          payAmount: business.unlockFee,
          status: 'pending_payment',
          businessId,
          remark: `解锁商机: ${business.title}`,
        },
      }),
      this.prisma.businessUnlock.create({
        data: {
          businessId,
          userId,
          feePaid: 0,
          orderNo,
        },
      }),
    ]);

    return { unlock, order: { id: order.id, orderNo: order.orderNo }, needPay: true };
  }

  /**
   * 校验用户免费商机解锁次数上限。
   * 配置读取系统配置 business_free_unlock：{"default":3,"vip":{"1":5,"2":8}}
   * - default：普通（非 VIP）会员可解锁的免费商机次数
   * - vip：各 VIP 等级对应的免费商机解锁次数（未配置的等级回退到 default）
   */
  private async checkFreeUnlockLimit(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const used = await this.prisma.businessUnlock.count({
      where: { userId, business: { unlockFee: { lte: 0 } } },
    });

    let cfg: { default: number; vip: Record<string, number> } = { default: 3, vip: {} };
    try {
      const row = await this.prisma.systemConfig.findUnique({ where: { key: 'business_free_unlock' } });
      if (row?.value) cfg = { default: 3, vip: {}, ...JSON.parse(row.value) };
    } catch {
      // 配置解析失败时使用默认值
    }

    const now = new Date();
    const isVip = user.vipLevel > 0 && !!user.vipExpireAt && user.vipExpireAt > now;
    const limit = isVip
      ? (cfg.vip?.[String(user.vipLevel)] ?? cfg.default)
      : cfg.default;

    if (used >= limit) {
      throw new ForbiddenException('您的免费商机解锁次数已达上限，可升级会员或解锁付费商机');
    }
  }

  async fulfillBusinessUnlock(orderNo: string) {
    const unlock = await this.prisma.businessUnlock.findUnique({ where: { orderNo } });
    if (!unlock || unlock.feePaid > 0) return;

    const business = await this.prisma.business.findUnique({ where: { id: unlock.businessId } });
    if (!business) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.businessUnlock.update({
        where: { id: unlock.id },
        data: { feePaid: business.unlockFee },
      });
      await tx.business.update({
        where: { id: business.id },
        data: { currentUnlocks: { increment: 1 } },
      });
    });

    try {
      await this.pointService.awardPoints(unlock.userId, 'unlock_business', '解锁商机');
    } catch (err) {
      console.error('解锁商机积分发放失败:', err);
    }

    // 付费商机成交后：将成交金额的 70% 作为收益发放至发布者余额账户
    if (business.unlockFee > 0) {
      try {
        await this.balanceService.addBusinessIncome(
          business.publisherId,
          { id: business.id, title: business.title, unlockFee: business.unlockFee },
          BUSINESS_INCOME_RATIO,
        );
      } catch (err) {
        console.error('商机收益入账失败:', err);
      }
    }
  }

  async getMyBusinesses(userId: number, params?: { page?: number; size?: number }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    return {
      list: await this.prisma.business.findMany({
        where: { publisherId: userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      total: await this.prisma.business.count({ where: { publisherId: userId } }),
    };
  }
}
