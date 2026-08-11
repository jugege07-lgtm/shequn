import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PointService } from '../point/point.service';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
  ) {}

  /** 活动分类统一来源：移动端与管理端共用同一份数据，保证前后端一致 */
  getActivityTypes() {
    return [
      { value: '沙龙', label: '沙龙' },
      { value: '路演', label: '路演' },
      { value: '培训', label: '培训' },
      { value: '展会', label: '展会' },
      { value: '聚会', label: '聚会' },
      { value: '工作坊', label: '工作坊' },
      { value: '会议', label: '会议' },
      { value: '线上活动', label: '线上活动' },
    ];
  }

  async getPublicActivities(params?: { page?: number; size?: number; filter?: string }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    const filter = params?.filter;
    const where: any = { status: 'approved' };
    const now = new Date();

    if (filter === 'free') {
      where.price = 0;
    } else if (filter === 'paid') {
      where.price = { gt: 0 };
    } else if (filter === 'upcoming') {
      where.startTime = { gt: now };
    } else if (filter === 'ended') {
      where.endTime = { lt: now };
    }

    const [list, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { publisher: { select: { nickname: true, avatarUrl: true } } },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async createActivity(dto: any, publisherId: number) {
    return this.prisma.activity.create({
      data: {
        title: dto.title,
        coverImage: dto.coverImage,
        description: dto.description,
        images: dto.images ?? '[]',
        type: dto.type,
        price: dto.price ?? 0,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        maxParticipants: dto.maxParticipants,
        status: 'pending',
        publisherId,
      },
    });
  }

  async getActivityDetail(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, avatarUrl: true } },
        signups: {
          where: { status: 'confirmed' },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            userId: true,
            user: { select: { nickname: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!activity) throw new NotFoundException('活动不存在');

    const signupUsers = activity.signups
      .map((s) => ({
        userId: s.userId,
        nickname: s.user.nickname,
        avatarUrl: s.user.avatarUrl,
      }))
      .filter((u) => u.avatarUrl);

    return {
      ...activity,
      signupUsers,
      viewCount: activity.viewCount ?? 0,
      favoriteCount: activity.favoriteCount ?? 0,
    };
  }

  /** 记录一次浏览量（每次打开详情页调用） */
  async recordView(id: number) {
    await this.prisma.activity.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    const updated = await this.prisma.activity.findUnique({
      where: { id },
      select: { viewCount: true },
    });
    return { viewCount: updated?.viewCount ?? 0 };
  }

  /** 获取当前用户收藏状态 */
  async getFavoriteStatus(activityId: number, userId: number) {
    const [activity, favorite] = await Promise.all([
      this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { favoriteCount: true },
      }),
      this.prisma.activityFavorite.findUnique({
        where: { activityId_userId: { activityId, userId } },
      }),
    ]);
    if (!activity) throw new NotFoundException('活动不存在');
    return {
      favorited: !!favorite,
      favoriteCount: activity.favoriteCount ?? 0,
    };
  }

  /** 收藏 / 取消收藏（切换） */
  async toggleFavorite(activityId: number, userId: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true },
    });
    if (!activity) throw new NotFoundException('活动不存在');

    const existing = await this.prisma.activityFavorite.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.activityFavorite.delete({ where: { id: existing.id } }),
        this.prisma.activity.update({
          where: { id: activityId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.activityFavorite.create({ data: { activityId, userId } }),
        this.prisma.activity.update({
          where: { id: activityId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);
    }

    const updated = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { favoriteCount: true },
    });
    return {
      favorited: !existing,
      favoriteCount: updated?.favoriteCount ?? 0,
    };
  }

  async getMyActivities(userId: number, params?: { page?: number; size?: number }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    return {
      list: await this.prisma.activity.findMany({
        where: { publisherId: userId },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      total: await this.prisma.activity.count({ where: { publisherId: userId } }),
    };
  }

  async getSignedActivities(userId: number, params?: { page?: number; size?: number }) {
    const page = Number(params?.page) || 1;
    const size = Number(params?.size) || 20;
    const [signups, total] = await Promise.all([
      this.prisma.activitySignup.findMany({
        where: { userId, status: 'confirmed' },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { activity: true },
      }),
      this.prisma.activitySignup.count({ where: { userId, status: 'confirmed' } }),
    ]);
    return { list: signups.map((s) => s.activity).filter(Boolean), total, page, size };
  }

  async getSignupStatus(activityId: number, userId: number) {
    const signup = await this.prisma.activitySignup.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
    if (!signup) return { isSignedUp: false, status: null, orderNo: null };
    return {
      isSignedUp: signup.status === 'confirmed',
      status: signup.status,
      orderNo: signup.orderNo,
    };
  }

  async signupActivity(activityId: number, userId: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('活动不存在');
    if (activity.status !== 'approved') throw new BadRequestException('活动未通过审核，无法报名');

    const maxP = activity.maxParticipants ?? 0;
    if (maxP > 0 && activity.signupCount >= maxP) {
      throw new ForbiddenException('活动名额已满');
    }

    const existing = await this.prisma.activitySignup.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });

    if (existing) {
      if (existing.status === 'confirmed') {
        return { signup: existing, needPay: false, message: '您已报名该活动' };
      }
      // 待支付：返回已有订单
      const order = await this.prisma.order.findFirst({
        where: { activityId, userId, orderType: 'activity_signup', status: 'pending_payment' },
      });
      if (order) {
        return { signup: existing, order: { id: order.id, orderNo: order.orderNo }, needPay: true };
      }
      // 订单异常，重新创建
      await this.prisma.activitySignup.delete({ where: { id: existing.id } });
    }

    // 免费活动直接确认报名
    if (!activity.price || activity.price <= 0) {
      const orderNo = `ACT_FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const signup = await this.prisma.activitySignup.create({
        data: {
          activityId,
          userId,
          status: 'confirmed',
          paidAmount: 0,
          orderNo,
        },
      });

      await this.prisma.activity.update({
        where: { id: activityId },
        data: { signupCount: { increment: 1 } },
      });

      try {
        await this.pointService.awardPoints(userId, 'activity_signup', '活动报名');
      } catch (err) {
        console.error('活动报名积分发放失败:', err);
      }

      return { signup, needPay: false };
    }

    // 收费活动：创建待支付订单 + 待确认报名记录
    const orderNo = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [order, signup] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          orderNo,
          userId,
          orderType: 'activity_signup',
          totalAmount: activity.price,
          discountAmount: 0,
          payAmount: activity.price,
          status: 'pending_payment',
          activityId,
          remark: `活动报名: ${activity.title}`,
        },
      }),
      this.prisma.activitySignup.create({
        data: {
          activityId,
          userId,
          status: 'pending_payment',
          paidAmount: 0,
          orderNo,
        },
      }),
    ]);

    return { signup, order: { id: order.id, orderNo: order.orderNo }, needPay: true };
  }

  async fulfillActivitySignup(orderNo: string) {
    const signup = await this.prisma.activitySignup.findUnique({ where: { orderNo } });
    if (!signup || signup.status === 'confirmed') return;

    const activity = await this.prisma.activity.findUnique({ where: { id: signup.activityId } });
    if (!activity) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.activitySignup.update({
        where: { id: signup.id },
        data: { status: 'confirmed', paidAmount: activity.price },
      });
      await tx.activity.update({
        where: { id: signup.activityId },
        data: { signupCount: { increment: 1 } },
      });
    });

    try {
      await this.pointService.awardPoints(signup.userId, 'activity_signup', '活动报名');
    } catch (err) {
      console.error('活动报名积分发放失败:', err);
    }
  }

  private getVerifySecret() {
    return process.env.JWT_SECRET || 'activity-verify-secret';
  }

  private generateVerifyToken(activityId: number) {
    return crypto
      .createHmac('sha256', this.getVerifySecret())
      .update(String(activityId))
      .digest('hex');
  }

  private verifyToken(activityId: number, token: string) {
    const expected = this.generateVerifyToken(activityId);
    if (expected.length !== token.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
      return false;
    }
  }

  async verifySignup(activityId: number, token: string, userId: number) {
    if (!this.verifyToken(activityId, token)) {
      throw new BadRequestException('无效的核销二维码');
    }

    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('活动不存在');

    const signup = await this.prisma.activitySignup.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });

    if (!signup) {
      return {
        success: false,
        code: 'NOT_SIGNED_UP',
        message: '您尚未报名该活动',
        activityId,
      };
    }

    if (signup.status !== 'confirmed') {
      return {
        success: false,
        code: 'NOT_PAID',
        message: '报名未支付或支付未完成',
        activityId,
      };
    }

    if (signup.checkedInAt) {
      return {
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: '您已完成核销，无需重复核销',
        activityId,
        checkedInAt: signup.checkedInAt,
      };
    }

    const updated = await this.prisma.activitySignup.update({
      where: { id: signup.id },
      data: { checkedInAt: new Date() },
    });

    return {
      success: true,
      code: 'CHECK_IN_SUCCESS',
      message: '核销成功',
      activityId,
      checkedInAt: updated.checkedInAt,
      activityTitle: activity.title,
    };
  }
}
