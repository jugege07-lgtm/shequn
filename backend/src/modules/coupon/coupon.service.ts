import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CouponService extends PrismaService {
  /**
   * 获取优惠券列表（公开）
   * 如果传入 userId（来自 CurrentUser 装饰器）,会附带当前用户的领取情况
   */
  async getCoupons(params?: {
    page?: number;
    size?: number;
    userId?: number;
  }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 50), 10) || 50;
    const where = { status: 1 };
    const [list, total] = await Promise.all([
      this.coupon.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
      }),
      this.coupon.count({ where }),
    ]);

    // 计算每个券的当前用户领取情况（避免 N+1：批量查 user_coupons）
    let userClaimMap: Record<number, number> = {};
    if (params?.userId && list.length > 0) {
      const userCoupons = await this.userCoupon.findMany({
        where: {
          userId: params.userId,
          couponId: { in: list.map((c: any) => c.id) },
        },
        select: { couponId: true },
      });
      for (const uc of userCoupons) {
        userClaimMap[uc.couponId] = (userClaimMap[uc.couponId] || 0) + 1;
      }
    }

    const now = Date.now();
    const enriched = list.map((c: any) => {
      const remaining = Math.max(0, c.totalQty - c.claimedQty);
      const userClaimCount = userClaimMap[c.id] || 0;
      const isSoldOut = remaining <= 0;
      const isNotStarted = c.validFrom && new Date(c.validFrom).getTime() > now;
      const isExpired = c.validTo && new Date(c.validTo).getTime() < now;
      return {
        ...c,
        remaining,
        userClaimCount,
        userClaimed: userClaimCount >= (c.perUserLimit || 1),
        isSoldOut,
        isNotStarted,
        isExpired,
      };
    });

    return { list: enriched, total, page, size };
  }

  /** 获取优惠券详情 */
  async getCoupon(id: number) {
    return this.coupon.findUnique({ where: { id } });
  }

  /**
   * 校验领券资格（不修改数据），返回结构化错误码便于前端提示
   * 错误码:
   *   NOT_FOUND     - 券不存在
   *   OFFLINE       - 券已下架
   *   NOT_STARTED   - 活动未开始
   *   ENDED         - 活动已结束
   *   SOLD_OUT      - 已抢光
   *   ALREADY       - 用户已达限领数量
   */
  private async checkClaimable(userId: number, couponId: number) {
    const coupon = await this.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new BadRequestException({ code: 'NOT_FOUND', message: '优惠券不存在' });
    }
    if (coupon.status !== 1) {
      throw new BadRequestException({ code: 'OFFLINE', message: '优惠券已下架' });
    }
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new BadRequestException({
        code: 'NOT_STARTED',
        message: '领券活动尚未开始',
        startAt: coupon.validFrom,
      });
    }
    if (coupon.validTo && new Date(coupon.validTo) < now) {
      throw new BadRequestException({ code: 'ENDED', message: '领券活动已结束' });
    }
    if (coupon.claimedQty >= coupon.totalQty) {
      throw new BadRequestException({ code: 'SOLD_OUT', message: '优惠券已抢光' });
    }
    const limit = coupon.perUserLimit ?? 1;
    const userClaimCount = await this.userCoupon.count({
      where: { userId, couponId },
    });
    if (userClaimCount >= limit) {
      throw new BadRequestException({
        code: 'ALREADY',
        message: `每人限领 ${limit} 张，您已领取`,
      });
    }
    return coupon;
  }

  /**
   * 用户领取优惠券
   * 用 Prisma 事务保证 claimedQty 原子递增，杜绝并发超发
   */
  async claimCoupon(userId: number, couponId: number) {
    const coupon = await this.checkClaimable(userId, couponId);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + coupon.validDays);

    // 事务里先查剩余，再判断、再自增、再创建 user_coupon
    // 注意:Prisma 不支持 where 上的字段引用做条件原子更新，MySQL 也不支持
    // 所以用 $transaction 包两层 + 二次校验防止超发
    const userCoupon = await this.$transaction(async (tx) => {
      const fresh = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!fresh || fresh.status !== 1) {
        throw new BadRequestException({ code: 'OFFLINE', message: '优惠券已下架' });
      }
      if (fresh.claimedQty >= fresh.totalQty) {
        throw new BadRequestException({ code: 'SOLD_OUT', message: '优惠券已抢光' });
      }
      const limit = fresh.perUserLimit ?? 1;
      const uc = await tx.userCoupon.count({ where: { userId, couponId } });
      if (uc >= limit) {
        throw new BadRequestException({ code: 'ALREADY', message: '您已领取过该券' });
      }
      const [created] = await Promise.all([
        tx.userCoupon.create({
          data: {
            couponId,
            userId,
            claimedAt: now,
            expiresAt,
            status: 'unused',
          },
        }),
        tx.coupon.update({
          where: { id: couponId },
          data: { claimedQty: { increment: 1 } },
        }),
      ]);
      return created;
    });

    return userCoupon;
  }

  /**
   * 后台精准发放：校验规则同 claimCoupon，但不读 perUserLimit
   * 仍走事务防超发
   */
  async assignCoupon(userId: number, couponId: number) {
    const coupon = await this.checkClaimable(userId, couponId);
    // 跳过 perUserLimit 检查（管理员后台发放不受此限）
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + coupon.validDays);

    const userCoupon = await this.$transaction(async (tx) => {
      const fresh = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!fresh || fresh.status !== 1) {
        throw new BadRequestException({ code: 'OFFLINE', message: '优惠券已下架' });
      }
      if (fresh.claimedQty >= fresh.totalQty) {
        throw new BadRequestException({ code: 'SOLD_OUT', message: '优惠券已发完' });
      }
      const [created] = await Promise.all([
        tx.userCoupon.create({
          data: {
            couponId,
            userId,
            claimedAt: now,
            expiresAt,
            status: 'unused',
          },
        }),
        tx.coupon.update({
          where: { id: couponId },
          data: { claimedQty: { increment: 1 } },
        }),
      ]);
      return created;
    });

    return userCoupon;
  }

  /** 获取用户已领的券 */
  async getUserCoupons(userId: number, params?: { page?: number; size?: number; status?: string }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = { userId };
    if (params?.status) where.status = params.status;

    const [list, total] = await Promise.all([
      this.userCoupon.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { expiresAt: 'asc' },
        include: { coupon: true },
      }),
      this.userCoupon.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 使用优惠券（标记为已使用） */
  async useCoupon(userCouponId: number, orderNo: string) {
    const uc = await this.userCoupon.findUnique({ where: { id: userCouponId } });
    if (!uc) throw new BadRequestException({ code: 'NOT_FOUND', message: '优惠券不存在' });
    if (uc.status !== 'unused') {
      throw new BadRequestException({ code: 'STATUS_ERR', message: '优惠券状态异常' });
    }
    return this.userCoupon.update({
      where: { id: userCouponId },
      data: { status: 'used', orderNo, usedAt: new Date() },
    });
  }

  // ===== 管理端 =====

  /** 创建优惠券 */
  async createCoupon(data: any) {
    // 入参校验
    if (data.type === 'percent') {
      const v = Number(data.value);
      if (!(v > 0 && v <= 1)) {
        throw new BadRequestException({ code: 'BAD_VALUE', message: '折扣率必须在 (0, 1] 之间' });
      }
    } else if (data.type === 'fixed') {
      if (!(Number(data.value) > 0)) {
        throw new BadRequestException({ code: 'BAD_VALUE', message: '面额必须大于 0' });
      }
    }
    if (Number(data.totalQty) <= 0) {
      throw new BadRequestException({ code: 'BAD_QTY', message: '总发放数量必须大于 0' });
    }
    if (Number(data.perUserLimit) <= 0) {
      throw new BadRequestException({ code: 'BAD_LIMIT', message: '每人限领数量必须大于 0' });
    }
    if (data.validFrom && data.validTo && new Date(data.validFrom) >= new Date(data.validTo)) {
      throw new BadRequestException({ code: 'BAD_RANGE', message: '开始时间必须早于结束时间' });
    }

    const now = new Date();
    return this.coupon.create({
      data: {
        name: String(data.name || '').trim(),
        description: String(data.description || ''),
        type: data.type === 'percent' ? 'percent' : 'fixed',
        value: Number(data.value) || 0,
        minAmount: Number(data.minAmount) || 0,
        discountCap: data.discountCap != null && data.discountCap !== '' ? Number(data.discountCap) : null,
        totalQty: Number(data.totalQty) || 0,
        claimedQty: 0,
        perUserLimit: Number(data.perUserLimit) || 1,
        validDays: Number(data.validDays) || 7,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        status: data.status ?? 1,
        sortOrder: Number(data.sortOrder) || 0,
      },
    });
  }

  /** 更新优惠券 */
  async updateCoupon(id: number, data: any) {
    // 入参校验（同 create）
    if (data.type === 'percent') {
      const v = Number(data.value);
      if (!(v > 0 && v <= 1)) {
        throw new BadRequestException({ code: 'BAD_VALUE', message: '折扣率必须在 (0, 1] 之间' });
      }
    }
    if (data.validFrom && data.validTo && new Date(data.validFrom) >= new Date(data.validTo)) {
      throw new BadRequestException({ code: 'BAD_RANGE', message: '开始时间必须早于结束时间' });
    }

    const payload: any = {};
    const fields = [
      'name', 'description', 'type', 'value', 'minAmount',
      'discountCap', 'totalQty', 'perUserLimit', 'validDays',
      'validFrom', 'validTo', 'status', 'sortOrder',
    ] as const;
    for (const f of fields) {
      if (data[f] !== undefined) payload[f] = data[f];
    }
    if (payload.discountCap === '' || payload.discountCap === null) {
      payload.discountCap = null;
    } else if (payload.discountCap !== undefined) {
      payload.discountCap = Number(payload.discountCap);
    }
    if (payload.totalQty !== undefined) payload.totalQty = Number(payload.totalQty);
    if (payload.perUserLimit !== undefined) payload.perUserLimit = Number(payload.perUserLimit);
    if (payload.validFrom) payload.validFrom = new Date(payload.validFrom);
    if (payload.validTo) payload.validTo = new Date(payload.validTo);

    return this.coupon.update({ where: { id }, data: payload });
  }

  /** 删除优惠券 */
  async deleteCoupon(id: number) {
    // 级联删除 user_coupons
    await this.$transaction([
      this.userCoupon.deleteMany({ where: { couponId: id } }),
      this.coupon.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  /** 获取所有优惠券（管理端） */
  async getAllCoupons(params?: { page?: number; size?: number }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const [list, total] = await Promise.all([
      this.coupon.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
      }),
      this.coupon.count(),
    ]);
    return { list, total, page, size };
  }

  /** 获取领取记录 */
  async getClaimRecords(params?: { page?: number; size?: number; couponId?: number; userId?: number }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where: any = {};
    if (params?.couponId) where.couponId = params.couponId;
    if (params?.userId) where.userId = params.userId;

    const [list, total] = await Promise.all([
      this.userCoupon.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { claimedAt: 'desc' },
        include: { coupon: true, user: true },
      }),
      this.userCoupon.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 批量发放（管理端给指定用户发券） */
  async batchAssign(couponId: number, userIds: number[]) {
    const results: any[] = [];
    for (const userId of userIds) {
      try {
        // 管理员批量发放不走 perUserLimit 检查
        await this.adminAssign(userId, couponId);
        results.push({ userId, success: true });
      } catch (err: any) {
        results.push({
          userId,
          success: false,
          error: err?.message || String(err),
        });
      }
    }
    return results;
  }

  /**
   * 管理员直接发券（不校验 perUserLimit,不走时间窗）
   * 用于管理后台强制发放/补发场景
   */
  private async adminAssign(userId: number, couponId: number) {
    const coupon = await this.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new BadRequestException({ code: 'NOT_FOUND', message: '优惠券不存在' });
    if (coupon.status !== 1) {
      throw new BadRequestException({ code: 'OFFLINE', message: '优惠券已下架' });
    }
    if (coupon.claimedQty >= coupon.totalQty) {
      throw new BadRequestException({ code: 'SOLD_OUT', message: '优惠券已发完' });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + coupon.validDays);

    return this.$transaction([
      this.userCoupon.create({
        data: {
          couponId,
          userId,
          claimedAt: now,
          expiresAt,
          status: 'unused',
        },
      }),
      this.coupon.update({
        where: { id: couponId },
        data: { claimedQty: { increment: 1 } },
      }),
    ]);
  }
}