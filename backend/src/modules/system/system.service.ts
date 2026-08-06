import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as dayjs from 'dayjs';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getConfig(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  async getConfigs(): Promise<{ key: string; value: string; description: string }[]> {
    const configs = await this.prisma.systemConfig.findMany();
    return configs.map((c) => ({
      key: c.key,
      value: c.value,
      description: c.description,
    }));
  }

  async setConfig(key: string, value: string, description = ''): Promise<void> {
    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async setConfigs(configs: { key: string; value: string; description?: string }[]): Promise<void> {
    for (const c of configs) {
      await this.setConfig(c.key, c.value, c.description || '');
    }
  }

  async deleteConfig(key: string): Promise<void> {
    await this.prisma.systemConfig.deleteMany({ where: { key } });
  }

  // ========== Dashboard 统计 ==========
  async getDashboardStats() {
    const [userCount, activityCount, businessCount, productCount, orderCount, vipCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.activity.count(),
        this.prisma.business.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.user.count({ where: { vipLevel: { gt: 0 } } }),
      ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayOrders, todayRevenue, pendingActivityCount, pendingBusinessCount] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({ where: { createdAt: { gte: today }, status: 'paid' }, _sum: { payAmount: true } }),
      this.prisma.activity.count({ where: { status: 'pending' } }),
      this.prisma.business.count({ where: { status: 'pending' } }),
    ]);

    // 近 7 天营收趋势
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const [agg, orderCnt] = await Promise.all([
        this.prisma.order.aggregate({
          where: { createdAt: { gte: start, lte: end }, status: 'paid' },
          _sum: { payAmount: true },
        }),
        this.prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      last7Days.push({
        date: d.format('MM-DD'),
        revenue: agg._sum.payAmount || 0,
        orders: orderCnt,
      });
    }

    // 近 7 天新增用户趋势
    const last7DaysUsers: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const cnt = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      last7DaysUsers.push({ date: d.format('MM-DD'), count: cnt });
    }

    return {
      userCount,
      activityCount,
      businessCount,
      productCount,
      orderCount,
      vipCount,
      nonVipCount: userCount - vipCount,
      todayOrders,
      todayRevenue: todayRevenue._sum.payAmount || 0,
      pendingActivityCount,
      pendingBusinessCount,
      last7Days,
      last7DaysUsers,
    };
  }

  // ========== 大屏聚合统计 ==========
  async getBigScreenStats() {
    const [
      userCount,
      vipCount,
      activityCount,
      businessCount,
      productCount,
      orderCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { vipLevel: { gt: 0 } } }),
      this.prisma.activity.count(),
      this.prisma.business.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayOrders, todayRevenueAgg] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: 'paid' },
        _sum: { payAmount: true },
      }),
    ]);

    // 用户增长趋势（近14天）
    const userGrowthTrend: { date: string; count: number; total: number }[] = [];
    let runningTotal = userCount;
    // 计算14天前累计用户数
    const fourteenDaysAgo = dayjs().subtract(13, 'day').startOf('day').toDate();
    const usersBefore14Days = await this.prisma.user.count({
      where: { createdAt: { lt: fourteenDaysAgo } },
    });
    runningTotal = usersBefore14Days;
    for (let i = 13; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const cnt = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      runningTotal += cnt;
      userGrowthTrend.push({ date: d.format('MM-DD'), count: cnt, total: runningTotal });
    }

    // 用户来源分布（按 openid 前缀分组）
    const wechatUsers = await this.prisma.user.count({
      where: { openid: { not: { startsWith: 'phone_' } } },
    });
    const phoneUsers = await this.prisma.user.count({
      where: { openid: { startsWith: 'phone_' } },
    });
    const adminUsers = await this.prisma.user.count({
      where: { openid: { startsWith: 'admin_' } },
    });
    const userSource = [
      { name: '微信用户', value: wechatUsers },
      { name: '手机注册', value: phoneUsers },
      { name: '管理员', value: adminUsers },
    ].filter((d) => d.value > 0);

    // 用户活跃度（按 VIP 等级分组）
    const vip0 = await this.prisma.user.count({ where: { vipLevel: 0 } });
    const vip1 = await this.prisma.user.count({ where: { vipLevel: 1 } });
    const vip2 = await this.prisma.user.count({ where: { vipLevel: 2 } });
    const vip3 = await this.prisma.user.count({ where: { vipLevel: { gte: 3 } } });
    const userActivity = [
      { name: '普通用户', value: vip0 },
      { name: 'VIP1', value: vip1 },
      { name: 'VIP2', value: vip2 },
      { name: 'VIP3+', value: vip3 },
    ].filter((d) => d.value > 0);

    // 订单营收趋势（近14天）
    const orderRevenueTrend: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();
      const [orderCnt, revAgg] = await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: start, lte: end }, status: 'paid' },
          _sum: { payAmount: true },
        }),
      ]);
      orderRevenueTrend.push({
        date: d.format('MM-DD'),
        orders: orderCnt,
        revenue: revAgg._sum.payAmount || 0,
      });
    }

    // VIP 等级分布
    const vipDistribution = [
      { name: '普通用户', value: vip0 },
      { name: 'VIP1', value: vip1 },
      { name: 'VIP2', value: vip2 },
      { name: 'VIP3', value: await this.prisma.user.count({ where: { vipLevel: 3 } }) },
      { name: 'VIP4+', value: await this.prisma.user.count({ where: { vipLevel: { gte: 4 } } }) },
    ].filter((d) => d.value > 0);

    // 活动类型分布
    const freeActivities = await this.prisma.activity.count({ where: { type: 'free' } });
    const paidActivities = await this.prisma.activity.count({ where: { type: 'paid' } });
    const activityTypeDistribution = [
      { name: '免费活动', value: freeActivities },
      { name: '付费活动', value: paidActivities },
    ].filter((d) => d.value > 0);

    // 省份分布（从用户地址表统计）
    const provinceRaw = await this.prisma.userAddress.groupBy({
      by: ['province'],
      _count: { province: true },
    });
    const provinceDistribution = provinceRaw
      .map((p) => ({ name: p.province, value: p._count.province }))
      .filter((d) => d.name)
      .sort((a, b) => b.value - a.value);

    // 商品分类分布
    const productCategoryRaw = await this.prisma.product.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
    });
    const categories = await this.prisma.productCategory.findMany();
    const productCategoryDistribution = productCategoryRaw
      .map((p) => {
        const cat = categories.find((c) => c.id === p.categoryId);
        return { name: cat?.name || `分类${p.categoryId}`, value: p._count.categoryId };
      })
      .filter((d) => d.value > 0);

    return {
      overview: {
        userCount,
        vipCount,
        activityCount,
        businessCount,
        productCount,
        orderCount,
        todayOrders,
        todayRevenue: todayRevenueAgg._sum.payAmount || 0,
      },
      userGrowthTrend,
      userSource,
      userActivity,
      orderRevenueTrend,
      vipDistribution,
      activityTypeDistribution,
      provinceDistribution,
      productCategoryDistribution,
    };
  }

  // ========== Banner 管理 ==========
  async getBanners() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createBanner(data: any) {
    return this.prisma.banner.create({ data });
  }

  async updateBanner(id: number, data: any) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: number) {
    return this.prisma.banner.delete({ where: { id } });
  }

  // ========== 公告管理 ==========
  async getAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({ data });
  }

  async updateAnnouncement(id: number, data: any) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async deleteAnnouncement(id: number) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  // ========== 版本管理 ==========
  async getVersions() {
    return this.prisma.appVersion.findMany({ orderBy: { versionCode: 'desc' } });
  }

  async createVersion(data: any) {
    return this.prisma.appVersion.create({ data });
  }

  async updateVersion(id: number, data: any) {
    return this.prisma.appVersion.update({ where: { id }, data });
  }

  async deleteVersion(id: number) {
    return this.prisma.appVersion.delete({ where: { id } });
  }
}
