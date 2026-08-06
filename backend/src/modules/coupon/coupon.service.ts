import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CouponService extends PrismaService {
  /** 获取优惠券列表（公开） */
  async getCoupons(params?: { page?: number; size?: number }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const where = { status: 1 };
    const [list, total] = await Promise.all([
      this.coupon.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { sortOrder: 'desc' },
      }),
      this.coupon.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 获取优惠券详情 */
  async getCoupon(id: number) {
    return this.coupon.findUnique({ where: { id } });
  }

  /** 领取优惠券 */
  async claimCoupon(userId: number, couponId: number) {
    const coupon = await this.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error('优惠券不存在');
    if (coupon.status !== 1) throw new Error('优惠券已下架');
    if (coupon.claimedQty >= coupon.totalQty) throw new Error('优惠券已领完');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + coupon.validDays);

    const userCoupon = await this.userCoupon.create({
      data: {
        couponId,
        userId,
        claimedAt: now,
        expiresAt,
        status: 'unused',
      },
    });

    // 更新已领取数
    await this.coupon.update({
      where: { id: couponId },
      data: { claimedQty: { increment: 1 } },
    });

    return userCoupon;
  }

  /** 后台精准发放优惠券 */
  async assignCoupon(userId: number, couponId: number) {
    const coupon = await this.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error('优惠券不存在');
    if (coupon.status !== 1) throw new Error('优惠券已下架');
    if (coupon.claimedQty >= coupon.totalQty) throw new Error('优惠券已发完');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + coupon.validDays);

    const userCoupon = await this.userCoupon.create({
      data: {
        couponId,
        userId,
        claimedAt: now,
        expiresAt,
        status: 'unused',
      },
    });

    await this.coupon.update({
      where: { id: couponId },
      data: { claimedQty: { increment: 1 } },
    });

    return userCoupon;
  }

  /** 获取用户优惠券列表 */
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
    if (!uc) throw new Error('优惠券不存在');
    if (uc.status !== 'unused') throw new Error('优惠券状态异常');

    return this.userCoupon.update({
      where: { id: userCouponId },
      data: { status: 'used', orderNo, usedAt: new Date() },
    });
  }

  // ===== 管理端 =====

  /** 创建优惠券 */
  async createCoupon(data: any) {
    const now = new Date();
    const validFrom = data.validFrom ? new Date(data.validFrom) : now;
    const validTo = data.validTo ? new Date(data.validTo) : null;
    return this.coupon.create({
      data: {
        ...data,
        validFrom,
        validTo,
        totalQty: data.totalQty || 0,
        claimedQty: 0,
        validDays: data.validDays || 7,
        minAmount: data.minAmount || 0,
        value: data.value || 0,
        status: data.status ?? 1,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  /** 更新优惠券 */
  async updateCoupon(id: number, data: any) {
    return this.coupon.update({ where: { id }, data });
  }

  /** 删除优惠券 */
  async deleteCoupon(id: number) {
    return this.coupon.delete({ where: { id } });
  }

  /** 获取所有优惠券（管理端） */
  async getAllCoupons(params?: { page?: number; size?: number }) {
    const page = parseInt(String(params?.page ?? 1), 10) || 1;
    const size = parseInt(String(params?.size ?? 20), 10) || 20;
    const [list, total] = await Promise.all([
      this.coupon.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: { sortOrder: 'desc' },
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

  /** 批量发放 */
  async batchAssign(couponId: number, userIds: number[]) {
    const results = [];
    for (const userId of userIds) {
      try {
        await this.assignCoupon(userId, couponId);
        results.push({ userId, success: true });
      } catch (err: any) {
        results.push({ userId, success: false, error: err.message });
      }
    }
    return results;
  }
}
