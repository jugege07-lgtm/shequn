import { Injectable, BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  /** 系统预定义角色列表（单一数据源，前后端需保持一致） */
  static readonly VALID_ROLES = [
    { value: 'user', label: '普通用户', color: 'info', description: '基础权限，可浏览和参与' },
    { value: 'editor', label: '内容编辑', color: '', description: '可管理活动、商机、商品等内容' },
    { value: 'moderator', label: '审核员', color: 'warning', description: '可审核活动、评论等提交内容' },
    { value: 'operator', label: '运营', color: '', description: '可管理优惠券、积分规则、消息通知等运营功能' },
    { value: 'admin', label: '管理员', color: 'danger', description: '拥有后台全部管理权限，含角色修改' },
  ] as const;

  /** 校验角色列表是否合法 */
  validateRoles(roles: string | string[] | undefined): (typeof AdminService.VALID_ROLES)[number]['value'][] {
    const validValues = AdminService.VALID_ROLES.map(r => r.value);
    // 兼容旧格式：单字符串 → 数组
    let arr: string[];
    if (!roles || (Array.isArray(roles) && roles.length === 0)) {
      return ['user']; // 默认角色
    }
    if (typeof roles === 'string') {
      arr = roles.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      arr = [...roles];
    }
    // 过滤非法值
    const invalid = arr.filter(r => !validValues.includes(r as any));
    if (invalid.length > 0) {
      throw new BadRequestException(`非法角色值: ${invalid.join(',')}。可选值: ${validValues.join(', ')}`);
    }
    return arr as (typeof AdminService.VALID_ROLES)[number]['value'][];
  }

  // ============== 用户管理 ==============
  async getUsers(params: { page?: number; size?: number; keyword?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const keyword = params.keyword;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nickname: true, avatarUrl: true, phone: true,
          role: true, vipLevel: true, status: true, createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getUserDetail(id: number) {
    const [user, pointLogs, coupons, orders, activities, businesses] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: { card: true },
      }),
      this.prisma.pointLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.userCoupon.findMany({
        where: { userId: id },
        include: { coupon: { select: { name: true, type: true, value: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.activity.findMany({
        where: { publisherId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.business.findMany({
        where: { publisherId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return {
      ...user,
      pointLogs,
      coupons,
      orders,
      activities,
      businesses,
    };
  }

  async updateUser(id: number, dto: any) {
    const { card, pointLogs, coupons, orders, activities, businesses, ...userData } = dto;
    const data: any = { ...userData };
    // 角色字段校验（兼容单字符串和数组格式）
    if (data.role !== undefined) {
      data.role = this.validateRoles(data.role).join(',');
    }
    if (card) {
      data.card = {
        upsert: {
          create: {
            realName: card.realName || '',
            company: card.company || '',
            position: card.position || '',
            wechat: card.wechat || '',
            avatarUrl: card.avatarUrl || '',
            intro: card.intro || '',
          },
          update: {
            realName: card.realName ?? undefined,
            company: card.company ?? undefined,
            position: card.position ?? undefined,
            wechat: card.wechat ?? undefined,
            avatarUrl: card.avatarUrl ?? undefined,
            intro: card.intro ?? undefined,
          },
        },
      };
    }
    return this.prisma.user.update({
      where: { id },
      data,
      include: { card: true },
    });
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async disableUser(id: number) {
    return this.prisma.user.update({ where: { id }, data: { status: 'disabled' } });
  }

  async enableUser(id: number) {
    return this.prisma.user.update({ where: { id }, data: { status: 'normal' } });
  }

  async changeUserPassword(id: number, password: string) {
    if (!password || password.length < 6) {
      throw new BadRequestException('密码长度不能少于6位');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /** 专用：更新用户角色（含完整校验和操作日志） */
  async updateUserRoles(targetUserId: number, operatorId: number, roles: string[]) {
    // 1. 校验目标用户存在
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new BadRequestException('目标用户不存在');

    // 2. 校验角色值合法性
    const validRoles = this.validateRoles(roles);

    // 3. 安全检查：不允许移除最后一个管理员
    if (!validRoles.includes('admin')) {
      const adminCount = await this.prisma.user.count({
        where: { role: { contains: 'admin' }, status: 'normal' },
      });
      const targetWasAdmin = target.role.includes('admin');
      if (targetWasAdmin && adminCount <= 1) {
        throw new BadRequestException('系统至少需要保留一名管理员，无法移除该用户的管理员角色');
      }
    }

    // 4. 执行更新（多角色以逗号分隔存储，向后兼容单角色格式）
    const roleStr = validRoles.join(',');
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: roleStr },
    });

    return {
      userId: targetUserId,
      previousRole: target.role,
      newRole: roleStr,
      roles: validRoles,
      operatedBy: operatorId,
      operatedAt: new Date().toISOString(),
    };
  }

  // ============== 活动管理 ==============
  async getActivities(params: { page?: number; size?: number; status?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const status = params.status;
    const where: any = {};
    if (status) where.status = status;
    const [list, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { publisher: { select: { nickname: true } } },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async approveActivity(id: number) {
    return this.prisma.activity.update({ where: { id }, data: { status: 'approved', rejectReason: '' } as any });
  }

  async rejectActivity(id: number, reason?: string) {
    return this.prisma.activity.update({ where: { id }, data: { status: 'rejected', rejectReason: reason || '' } as any });
  }

  async getActivityDetail(id: number) {
    return this.prisma.activity.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, avatarUrl: true } },
        signups: true,
      },
    });
  }

  async createActivity(dto: any) {
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
        status: 'approved',
        publisherId: dto.publisherId ?? 1,
      },
    });
  }

  // 获取商机分类列表（供新增商机时选择）
  async getBusinessCategories() {
    return this.prisma.businessCategory.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateActivity(id: number, dto: any) {
    const data: any = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);
    delete data.id;
    return this.prisma.activity.update({ where: { id }, data });
  }

  async toggleActivityStatus(id: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id }, select: { status: true } });
    if (!activity) throw new Error('活动不存在');
    const nextStatus = activity.status === 'approved' ? 'offline' : 'approved';
    return this.prisma.activity.update({ where: { id }, data: { status: nextStatus } });
  }

  async deleteActivity(id: number) {
    // 先删除相关报名记录，再删除活动
    await this.prisma.activitySignup.deleteMany({ where: { activityId: id } });
    return this.prisma.activity.delete({ where: { id } });
  }

  async clearAllActivitySignups() {
    await this.prisma.activitySignup.deleteMany();
    await this.prisma.activity.updateMany({
      data: { signupCount: 0 },
    });
    return { success: true, deletedSignups: 0 };
  }

  async clearActivitySignups(activityId: number) {
    await this.prisma.activitySignup.deleteMany({ where: { activityId } });
  }

  async resetActivitySignupCount(activityId: number) {
    await this.prisma.activity.update({
      where: { id: activityId },
      data: { signupCount: 0 },
    });
  }

  async exportActivitySignups(activityId: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new BadRequestException('活动不存在');

    const signups = await this.prisma.activitySignup.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nickname: true, phone: true, id: true } },
      },
    });

    const headers = ['姓名', '手机号', '报名时间', '支付金额', '报名状态', '核销状态', '核销时间'];
    const rows = signups.map((s) => {
      const name = s.user?.nickname || '';
      const phone = s.user?.phone || '';
      const signupTime = s.createdAt ? new Date(s.createdAt).toLocaleString('zh-CN') : '';
      const paidAmount = String(s.paidAmount ?? 0);
      const status = s.status === 'confirmed' ? '已确认' : s.status;
      const verifyStatus = s.checkedInAt ? '已核销' : '未核销';
      const verifyTime = s.checkedInAt ? new Date(s.checkedInAt).toLocaleString('zh-CN') : '';
      return [name, phone, signupTime, paidAmount, status, verifyStatus, verifyTime].map(this.escapeCsv).join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    return {
      filename: `${activity.title}_报名人员_${Date.now()}.csv`,
      content: csv,
    };
  }

  private escapeCsv(value: string | number) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private getVerifySecret() {
    return process.env.JWT_SECRET || 'activity-verify-secret';
  }

  generateActivityVerifyToken(activityId: number) {
    return crypto
      .createHmac('sha256', this.getVerifySecret())
      .update(String(activityId))
      .digest('hex');
  }

  verifyActivityToken(activityId: number, token: string) {
    const expected = this.generateActivityVerifyToken(activityId);
    if (expected.length !== token.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
      return false;
    }
  }

  async generateActivityVerifyQrCode(activityId: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new BadRequestException('活动不存在');

    const token = this.generateActivityVerifyToken(activityId);
    const baseUrl = process.env.MOBILE_URL || 'http://localhost:5175';
    const verifyUrl = `${baseUrl}/activity/verify?id=${activityId}&t=${token}`;
    let qrDataUrl: string;
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 400, margin: 2 });
    } catch {
      // canvas 未安装时降级为 SVG data URL
      const svg = await QRCode.toString(verifyUrl, { type: 'svg', width: 400, margin: 2 });
      qrDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }

    return {
      activityId,
      verifyUrl,
      qrDataUrl,
      filename: `${activity.title}_核销二维码.png`,
    };
  }

  // ============== 商机管理 ==============
  async getBusinesses(params: { page?: number; size?: number; status?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const status = params.status;
    const where: any = {};
    if (status) where.status = status;
    const [list, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { publisher: { select: { nickname: true } } },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async approveBusiness(id: number) {
    return this.prisma.business.update({ where: { id }, data: { status: 'approved', rejectReason: '' } as any });
  }

  async rejectBusiness(id: number, reason?: string) {
    return this.prisma.business.update({ where: { id }, data: { status: 'rejected', rejectReason: reason || '' } as any });
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

  async createBusiness(dto: any) {
    return this.prisma.business.create({
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
        status: 'approved',
        publisherId: Number(dto.publisherId ?? 1),
      },
    });
  }

  async updateBusiness(id: number, dto: any) {
    const data: any = { ...dto };
    delete data.id;
    return this.prisma.business.update({ where: { id }, data });
  }

  async toggleBusinessStatus(id: number, status?: string) {
    const business = await this.prisma.business.findUnique({ where: { id }, select: { status: true } });
    if (!business) throw new Error('商机不存在');
    const nextStatus = status || (business.status === 'approved' ? 'offline' : 'approved');
    return this.prisma.business.update({ where: { id }, data: { status: nextStatus } });
  }

  async deleteBusiness(id: number) {
    return this.prisma.business.delete({ where: { id } });
  }

  // ============== 商品管理 ==============
  async getProducts(params: { page?: number; size?: number; keyword?: string; status?: number }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const keyword = params.keyword;
    const status = params.status !== undefined && params.status !== null ? Number(params.status) : undefined;
    const where: any = {};
    if (keyword) where.name = { contains: keyword };
    if (status !== undefined && status !== null) where.status = status;
    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getProduct(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async createProduct(data: any) {
    const payload: any = { ...data };
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    if (payload.images && typeof payload.images !== 'string') payload.images = JSON.stringify(payload.images);
    if (payload.specs && typeof payload.specs !== 'string') payload.specs = JSON.stringify(payload.specs);
    return this.prisma.product.create({ data: payload });
  }

  async updateProduct(id: number, data: any) {
    const payload: any = { ...data };
    delete payload.id;
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    if (payload.images && typeof payload.images !== 'string') payload.images = JSON.stringify(payload.images);
    if (payload.specs && typeof payload.specs !== 'string') payload.specs = JSON.stringify(payload.specs);
    return this.prisma.product.update({ where: { id }, data: payload });
  }

  async toggleProductStatus(id: number, status: number) {
    return this.prisma.product.update({ where: { id }, data: { status } });
  }

  async deleteProduct(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  // ============== 商品分类管理 ==============
  async getProductCategories(keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.name = { contains: keyword };
    }
    return this.prisma.productCategory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async getProductCategoryDetail(id: number) {
    return this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async createProductCategory(data: any) {
    // 校验名称唯一性
    const existing = await this.prisma.productCategory.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestException('商品分类名称已存在');
    }
    return this.prisma.productCategory.create({
      data: {
        name: data.name,
        icon: data.icon || '',
        sortOrder: Number(data.sortOrder) || 0,
        status: Number(data.status) ?? 1,
      },
    });
  }

  async updateProductCategory(id: number, data: any) {
    // 校验名称唯一性（排除自身）
    if (data.name !== undefined) {
      const existing = await this.prisma.productCategory.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException('商品分类名称已存在');
      }
    }
    const payload: any = { ...data };
    delete payload.id;
    delete payload.createdAt;
    delete payload._count;
    delete payload.products;
    if (payload.sortOrder !== undefined) payload.sortOrder = Number(payload.sortOrder);
    if (payload.status !== undefined) payload.status = Number(payload.status);
    return this.prisma.productCategory.update({
      where: { id },
      data: payload,
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async deleteProductCategory(id: number) {
    // 检查是否存在关联商品
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException(`该分类下存在 ${count} 个商品，无法删除`);
    }
    return this.prisma.productCategory.delete({ where: { id } });
  }

  // ============== 商机分类管理 ==============
  async getCategoryList(keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }
    return this.prisma.businessCategory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { businesses: true } },
      },
    });
  }

  async getCategoryDetail(id: number) {
    return this.prisma.businessCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { businesses: true } },
      },
    });
  }

  async createCategory(data: any) {
    // 校验名称唯一性
    const existingByName = await this.prisma.businessCategory.findFirst({
      where: { name: data.name },
    });
    if (existingByName) {
      throw new BadRequestException('分类名称已存在');
    }
    // 校验编码唯一性
    const existingByCode = await this.prisma.businessCategory.findFirst({
      where: { code: data.code },
    });
    if (existingByCode) {
      throw new BadRequestException('分类编码已存在');
    }
    return this.prisma.businessCategory.create({
      data: {
        name: data.name,
        code: data.code,
        icon: data.icon || '',
        sortOrder: Number(data.sortOrder) || 0,
        status: Number(data.status) || 1,
      },
    });
  }

  async updateCategory(id: number, data: any) {
    // 校验名称唯一性（排除自身）
    const existingByName = await this.prisma.businessCategory.findFirst({
      where: { name: data.name, id: { not: id } },
    });
    if (existingByName) {
      throw new BadRequestException('分类名称已存在');
    }
    // 校验编码唯一性（排除自身）
    const existingByCode = await this.prisma.businessCategory.findFirst({
      where: { code: data.code, id: { not: id } },
    });
    if (existingByCode) {
      throw new BadRequestException('分类编码已存在');
    }
    const payload: any = { ...data };
    delete payload.id;
    delete payload.createdAt;
    if (payload.sortOrder !== undefined) payload.sortOrder = Number(payload.sortOrder);
    if (payload.status !== undefined) payload.status = Number(payload.status);
    return this.prisma.businessCategory.update({
      where: { id },
      data: payload,
    });
  }

  async deleteCategory(id: number) {
    // 检查是否存在关联商机数据
    const count = await this.prisma.business.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw new BadRequestException(`该分类下还有 ${count} 条商机数据，无法删除`);
    }
    return this.prisma.businessCategory.delete({ where: { id } });
  }
  async getOrders(params: { page?: number; size?: number; status?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const status = params.status;
    const where: any = {};
    if (status) where.status = status;
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true } },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { list, total, page, size };
  }

  async getOrderDetail(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { nickname: true, phone: true } },
        items: true,
        refund: true,
      },
    });
  }

  async shipOrder(id: number, shippingNo: string, shippingCompany: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: 'shipped', shippingNo, shippingCompany },
    });
  }

  async approveRefund(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    const refund = await this.prisma.refund.findUnique({ where: { orderId: id } });
    if (!refund) throw new BadRequestException('该订单没有退款申请记录');

    // 调用微信支付退款 API
    await this.paymentService.refund(order, { refundAmount: refund.refundAmount, reason: refund.reason });

    await this.prisma.order.update({ where: { id }, data: { status: 'refunded' } });
    await this.prisma.refund.update({
      where: { orderId: id },
      data: { status: 'approved', processedAt: new Date() },
    });
    return { success: true };
  }

  async rejectRefund(id: number, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('订单不存在');
    const refund = await this.prisma.refund.findUnique({ where: { orderId: id } });
    await this.prisma.order.update({ where: { id }, data: { status: 'shipped' } });
    if (refund) {
      await this.prisma.refund.update({
        where: { orderId: id },
        data: { status: 'rejected', adminNote: reason },
      });
    }
    return { success: true };
  }

  // ============== VIP 套餐管理 ==============
  async getVipPlans() {
    return this.prisma.vipPlan.findMany({ orderBy: { level: 'asc' } });
  }

  async createVipPlan(data: any) {
    return this.prisma.vipPlan.create({ data });
  }

  async updateVipPlan(id: number, data: any) {
    return this.prisma.vipPlan.update({ where: { id }, data });
  }

  async deleteVipPlan(id: number) {
    return this.prisma.vipPlan.delete({ where: { id } });
  }

  async toggleVipPlanStatus(id: number, status: number) {
    return this.prisma.vipPlan.update({ where: { id }, data: { status } });
  }

  // ============== 消息管理 ==============
  async getNotifications(params: { page?: number; size?: number }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const [list, total] = await Promise.all([
      this.prisma.message.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { nickname: true } } },
      }),
      this.prisma.message.count(),
    ]);
    return { list, total, page, size };
  }

  async createNotification(data: { userId: number; title: string; content: string; type: string }) {
    return this.prisma.message.create({ data: { ...data, type: data.type || 'system' } });
  }
}
