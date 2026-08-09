import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BusinessService } from '../business/business.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly businessService: BusinessService,
  ) {}

  // ========== Announcements ==========
  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAnnouncement(id: number) {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  async createAnnouncement(data: { title: string; content: string; type?: string; sortOrder?: number }) {
    return this.prisma.announcement.create({ data: { ...data, sortOrder: data.sortOrder || 0 } });
  }

  async updateAnnouncement(id: number, data: { title?: string; content?: string; type?: string; status?: number; sortOrder?: number }) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async deleteAnnouncement(id: number) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  async getLatestAnnouncement() {
    return this.prisma.announcement.findFirst({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ========== Banners ==========
  async getBanners(position?: string) {
    const where: any = { status: 1 };
    if (position) where.position = position;
    return this.prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getBanner(id: number) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  async createBanner(data: {
    title: string; imageUrl: string; linkUrl?: string; linkType?: string;
    position?: string; sortOrder?: number;
  }) {
    return this.prisma.banner.create({ data: { ...data, sortOrder: data.sortOrder || 0 } });
  }

  async updateBanner(id: number, data: {
    title?: string; imageUrl?: string; linkUrl?: string; linkType?: string;
    position?: string; status?: number; sortOrder?: number;
  }) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: number) {
    return this.prisma.banner.delete({ where: { id } });
  }

  // ========== Home Sections ==========
  async getHomeSections() {
    return this.prisma.homeSection.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getHomeSection(key: string) {
    return this.prisma.homeSection.findUnique({ where: { key } });
  }

  async createHomeSection(data: {
    name: string; key: string; title: string; subtitle?: string;
    config?: string; sortOrder?: number;
  }) {
    return this.prisma.homeSection.create({ data: { ...data, sortOrder: data.sortOrder || 0 } });
  }

  async updateHomeSection(key: string, data: {
    name?: string; title?: string; subtitle?: string; config?: string;
    status?: number; sortOrder?: number;
  }) {
    return this.prisma.homeSection.update({ where: { key }, data });
  }

  async deleteHomeSection(key: string) {
    return this.prisma.homeSection.delete({ where: { key } });
  }

  // ========== Homepage data for mobile ==========
  async getHomepageData() {
    const [banners, announcements, sections, activities, businesses] = await Promise.all([
      this.getBanners('home'),
      this.getAnnouncements(),
      this.getHomeSections(),
      // 热门活动：按报名人数降序，取前 6 条已审核通过的
      this.prisma.activity.findMany({
        where: { status: 'approved' },
        orderBy: { signupCount: 'desc' },
        take: 6,
        include: { publisher: { select: { nickname: true, avatarUrl: true } } },
      }),
      // 最新商机：按创建时间降序，取前 6 条已审核通过的
      this.prisma.business.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          publisher: { select: { nickname: true, avatarUrl: true } },
        },
      }),
    ]);

    // 单独查询分类名称，避免 business_categories 表缺少 code 列导致查询失败
    const categoryIds = [...new Set(businesses.map((b) => b.categoryId).filter(Boolean))];
    const categories = categoryIds.length
      ? await this.prisma.businessCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const businessesWithCategory = businesses.map((b) => ({
      ...b,
      category: { name: categoryMap.get(b.categoryId) || '商机' },
    }));

    return { banners, announcements, sections, activities, businesses: businessesWithCategory };
  }

  // ========== Global search (activities / businesses / products) ==========
  async search(keyword: string) {
    const kw = (keyword || '').trim();
    if (!kw) return { keyword: '', activities: [], businesses: [], products: [] };

    const contains = { contains: kw };
    const [activities, businesses, products] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          status: 'approved',
          OR: [{ title: contains }, { description: contains }, { location: contains }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, title: true, coverImage: true, price: true,
          startTime: true, location: true, status: true,
        },
      }),
      this.prisma.business.findMany({
        where: {
          status: 'approved',
          OR: [{ title: contains }, { description: contains }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, title: true, coverImage: true, description: true,
          categoryId: true, unlockFee: true, status: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          status: 1,
          OR: [{ name: contains }, { description: contains }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, coverImage: true, price: true, vipPrice: true, status: true,
        },
      }),
    ]);

    return { keyword: kw, activities, businesses, products };
  }
}
