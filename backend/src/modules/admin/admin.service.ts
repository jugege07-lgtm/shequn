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

  /** 系统权限目录（按模块分组，供前端展示与权限配置） */
  static readonly PERMISSION_CATALOG: { group: string; code: string; label: string }[] = [
    { group: '数据看板', code: 'dashboard:view', label: '查看数据看板' },
    { group: '用户管理', code: 'user:view', label: '查看用户列表' },
    { group: '用户管理', code: 'user:manage', label: '编辑/禁用/删除用户' },
    { group: '用户管理', code: 'user:role', label: '分配用户角色' },
    { group: '活动管理', code: 'activity:view', label: '查看活动' },
    { group: '活动管理', code: 'activity:manage', label: '发布/编辑/删除活动' },
    { group: '活动管理', code: 'activity:audit', label: '审核活动' },
    { group: '商机管理', code: 'business:view', label: '查看商机' },
    { group: '商机管理', code: 'business:manage', label: '发布/编辑/删除商机' },
    { group: '商机管理', code: 'business:audit', label: '审核商机' },
    { group: '商品管理', code: 'product:manage', label: '商品及分类管理' },
    { group: '订单管理', code: 'order:view', label: '查看订单' },
    { group: '订单管理', code: 'order:manage', label: '发货/退款处理' },
    { group: 'VIP套餐', code: 'vip:manage', label: 'VIP套餐管理' },
    { group: '优惠券', code: 'coupon:manage', label: '优惠券管理' },
    { group: '积分规则', code: 'point:manage', label: '积分规则管理' },
    { group: '消息通知', code: 'message:manage', label: '消息通知管理' },
    { group: 'Banner管理', code: 'banner:manage', label: 'Banner管理' },
    { group: '公告管理', code: 'announcement:manage', label: '公告管理' },
    { group: '版本管理', code: 'version:manage', label: '版本管理' },
    { group: '系统配置', code: 'system:config', label: '系统配置与支付配置' },
    { group: '账号管理', code: 'staff:manage', label: '后台账号管理' },
    { group: '角色权限', code: 'role:manage', label: '角色权限配置' },
    { group: '操作日志', code: 'log:view', label: '查看操作日志' },
  ];

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

  // ============== 后台账号管理（管理员/编辑/审核/运营） ==============
  /** 后台可管理账号的角色集合 */
  private static STAFF_ROLES = ['admin', 'editor', 'moderator', 'operator'];

  async getStaffList(params: { page?: number; size?: number; keyword?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const keyword = params.keyword;
    // 角色为逗号分隔存储，需用 contains 逐个匹配，避免多角色账号漏查
    const roleOr = AdminService.STAFF_ROLES.map((r) => ({ role: { contains: r } }));
    const where: any = { OR: roleOr };
    if (keyword) {
      where.AND = [
        {
          OR: [
            { nickname: { contains: keyword } },
            { realName: { contains: keyword } },
            { phone: { contains: keyword } },
          ],
        },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nickname: true, realName: true, avatarUrl: true, phone: true,
          role: true, adminLevel: true, status: true, createdAt: true, lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { list, total, page, size };
  }

  /** 新增后台账号（用户名、密码、姓名、联系方式、角色） */
  async createStaff(operator: any, dto: any, ip: string) {
    const username = String(dto.username || '').trim();
    const password = String(dto.password || '');
    const realName = String(dto.realName || '').trim();
    const phone = String(dto.phone || '').trim();
    const roles = this.validateRoles(dto.roles);

    if (!username) throw new BadRequestException('用户名不能为空');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new BadRequestException('用户名需为 3-20 位字母、数字或下划线');
    }
    // 用户名唯一性
    const exist = await this.prisma.user.findFirst({ where: { nickname: username } });
    if (exist) throw new BadRequestException('该用户名已存在');
    // 手机号唯一性
    if (phone) {
      const phoneExist = await this.prisma.user.findFirst({ where: { phone } });
      if (phoneExist) throw new BadRequestException('该手机号已被占用');
    }
    // 密码强度校验
    this.assertPasswordStrength(password);
    // 至少需要一个后台角色
    if (!roles.some((r) => AdminService.STAFF_ROLES.includes(r))) {
      throw new BadRequestException('至少需要分配一个后台角色（编辑/审核/运营/管理员）');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        openid: `staff_${username}_${Date.now()}`,
        nickname: username,
        realName,
        avatarUrl: '',
        phone: phone || null,
        role: roles.join(','),
        adminLevel: roles.includes('admin') ? 1 : 0,
        password: hashedPassword,
      },
    });
    await this.logOperation(operator, 'system', 'create_admin', `新增后台账号「${username}」`, ip);
    return { id: user.id, nickname: user.nickname, realName: user.realName, phone: user.phone, roles };
  }

  /** 编辑后台账号（姓名、联系方式、角色） */
  async updateStaff(operator: any, id: number, dto: any, ip: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new BadRequestException('目标账号不存在');

    const data: any = {};
    const changes: string[] = [];

    if (dto.realName !== undefined) data.realName = String(dto.realName || '').trim();
    if (dto.phone !== undefined) {
      const phone = String(dto.phone || '').trim();
      if (phone) {
        const phoneExist = await this.prisma.user.findFirst({ where: { phone, id: { not: id } } });
        if (phoneExist) throw new BadRequestException('该手机号已被占用');
      }
      data.phone = phone || null;
    }
    if (dto.roles !== undefined) {
      const roles = this.validateRoles(dto.roles);
      if (!roles.some((r) => AdminService.STAFF_ROLES.includes(r))) {
        throw new BadRequestException('至少需要分配一个后台角色（编辑/审核/运营/管理员）');
      }
      // 安全检查：不允许移除最后一个管理员
      if (!roles.includes('admin')) {
        const adminCount = await this.prisma.user.count({
          where: { role: { contains: 'admin' }, status: 'normal' },
        });
        const targetWasAdmin = target.role.includes('admin');
        if (targetWasAdmin && adminCount <= 1) {
          throw new BadRequestException('系统至少需要保留一名管理员，无法移除该账号的管理员角色');
        }
      }
      data.role = roles.join(',');
      data.adminLevel = roles.includes('admin') ? 1 : 0;
      changes.push(`角色: ${target.role} → ${data.role}`);
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    await this.logOperation(operator, 'system', 'update_admin', `编辑后台账号「${target.nickname}」${changes.join('；')}`, ip);
    return {
      id: updated.id, nickname: updated.nickname, realName: updated.realName,
      phone: updated.phone, roles: String(updated.role || '').split(',').filter(Boolean),
    };
  }

  /** 删除后台账号（含安全校验） */
  async deleteStaff(operator: any, id: number, ip: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new BadRequestException('目标账号不存在');
    if (operator?.userId === id) {
      throw new BadRequestException('不能删除当前登录的账号');
    }
    if (target.role.includes('admin')) {
      const adminCount = await this.prisma.user.count({
        where: { role: { contains: 'admin' }, status: 'normal' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('系统至少需要保留一名管理员，无法删除该账号');
      }
    }
    // 删除该账号创建的关联数据（活动/商机等行受外键约束，先置空 publisher 或删除）
    await this.prisma.activity.updateMany({ where: { publisherId: id }, data: { publisherId: 1 } });
    await this.prisma.business.updateMany({ where: { publisherId: id }, data: { publisherId: 1 } });
    await this.prisma.user.delete({ where: { id } });
    await this.logOperation(operator, 'system', 'delete_admin', `删除后台账号「${target.nickname}」`, ip);
    return { success: true };
  }

  // ============== 密码管理 ==============
  /** 密码强度校验：至少 6 位，且包含字母与数字 */
  assertPasswordStrength(password: string) {
    if (!password || password.length < 6) {
      throw new BadRequestException('密码长度不能少于6位');
    }
    if (password.length > 32) {
      throw new BadRequestException('密码长度不能超过32位');
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      throw new BadRequestException('密码需同时包含字母和数字');
    }
  }

  /** 当前管理员修改自己的登录密码（需校验原密码） */
  async changeOwnPassword(operator: any, dto: any, ip: string) {
    const userId = operator?.userId;
    if (!userId) throw new BadRequestException('登录状态异常');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('账号不存在');

    // 校验原密码
    const oldOk = await bcrypt.compare(dto.oldPassword || '', user.password || '');
    if (!oldOk) throw new BadRequestException('原密码不正确');
    // 强度 + 确认
    this.assertPasswordStrength(dto.newPassword);
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await this.logOperation(operator, 'system', 'change_password', `修改了自己的登录密码`, ip);
    return { success: true };
  }

  /** 管理员重置指定后台账号的密码 */
  async resetStaffPassword(operator: any, id: number, dto: any, ip: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new BadRequestException('目标账号不存在');
    this.assertPasswordStrength(dto.newPassword);
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });
    await this.logOperation(operator, 'system', 'reset_password', `重置后台账号「${target.nickname}」的密码`, ip);
    return { success: true };
  }

  // ============== 角色权限管理 ==============
  /** 查询所有角色及其权限配置 */
  async getRolePermissions(): Promise<{ id: number; code: string; name: string; description: string; isSystem: number; permissions: string[] }[]> {
    const roles = await this.prisma.adminRole.findMany({ orderBy: { sortOrder: 'asc' } });
    // 若角色表为空，则按预定义角色初始化默认权限
    if (roles.length === 0) {
      await this.seedRoles();
      return this.getRolePermissions();
    }
    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: this.parsePermissions(r.permissions),
    }));
  }

  /** 保存单个角色的权限配置 */
  async saveRolePermission(operator: any, code: string, dto: any, ip: string) {
    const role = await this.prisma.adminRole.findUnique({ where: { code } });
    if (!role) throw new BadRequestException('角色不存在');
    const permissions: string[] = Array.isArray(dto.permissions) ? dto.permissions : [];
    // 校验权限码合法性
    const validCodes = new Set(AdminService.PERMISSION_CATALOG.map((p) => p.code));
    const invalid = permissions.filter((p) => !validCodes.has(p));
    if (invalid.length > 0) throw new BadRequestException(`非法权限码: ${invalid.join(', ')}`);
    // 管理员角色始终拥有全部权限，禁止降级
    if (role.code === 'admin') {
      await this.prisma.adminRole.update({
        where: { code },
        data: { permissions: JSON.stringify(Array.from(validCodes)) },
      });
      await this.logOperation(operator, 'role', 'update_role_permission', `更新角色「${role.name}」权限（管理员角色自动拥有全部权限）`, ip);
      return { code, permissions: Array.from(validCodes) };
    }
    await this.prisma.adminRole.update({
      where: { code },
      data: { permissions: JSON.stringify(permissions) },
    });
    await this.logOperation(operator, 'role', 'update_role_permission', `更新角色「${role.name}」权限配置`, ip);
    return { code, permissions };
  }

  /** 校验权限码数组是否均为合法权限码 */
  private filterValidPermissions(permissions: any): string[] {
    const validCodes = new Set(AdminService.PERMISSION_CATALOG.map((p) => p.code));
    return Array.isArray(permissions) ? permissions.filter((p) => validCodes.has(p)) : [];
  }

  /** 新增自定义角色 */
  async createRole(operator: any, dto: any, ip: string) {
    const code = String(dto.code || '').trim();
    const name = String(dto.name || '').trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]{1,19}$/.test(code)) {
      throw new BadRequestException('角色标识需为字母开头，仅含字母、数字、下划线，长度 2-20');
    }
    if (!name) throw new BadRequestException('角色名称不能为空');
    const exists = await this.prisma.adminRole.findUnique({ where: { code } });
    if (exists) throw new BadRequestException(`角色标识「${code}」已存在`);
    await this.prisma.adminRole.create({
      data: {
        code,
        name,
        description: String(dto.description || ''),
        permissions: JSON.stringify(this.filterValidPermissions(dto.permissions)),
        isSystem: 0,
        sortOrder: 100,
      },
    });
    await this.logOperation(operator, 'role', 'create_role', `新增角色「${name}」(${code})`, ip);
    return { code, name };
  }

  /** 编辑角色（名称/描述/权限） */
  async updateRole(operator: any, code: string, dto: any, ip: string) {
    const role = await this.prisma.adminRole.findUnique({ where: { code } });
    if (!role) throw new BadRequestException('角色不存在');
    const data: any = {};
    if (dto.name !== undefined) {
      const name = String(dto.name).trim();
      if (!name) throw new BadRequestException('角色名称不能为空');
      data.name = name;
    }
    if (dto.description !== undefined) data.description = String(dto.description);
    if (dto.permissions !== undefined) {
      // 管理员角色始终拥有全部权限，禁止降级
      data.permissions = JSON.stringify(
        role.code === 'admin' ? AdminService.PERMISSION_CATALOG.map((p) => p.code) : this.filterValidPermissions(dto.permissions)
      );
    }
    await this.prisma.adminRole.update({ where: { code }, data });
    await this.logOperation(operator, 'role', 'update_role', `更新角色「${role.name}」(${code})`, ip);
    return { code };
  }

  /** 删除自定义角色（系统内置角色不可删除） */
  async deleteRole(operator: any, code: string, ip: string) {
    const role = await this.prisma.adminRole.findUnique({ where: { code } });
    if (!role) throw new BadRequestException('角色不存在');
    if (role.isSystem === 1) throw new BadRequestException('系统内置角色不可删除');
    await this.prisma.adminRole.delete({ where: { code } });
    await this.logOperation(operator, 'role', 'delete_role', `删除角色「${role.name}」(${code})`, ip);
    return { success: true };
  }

  /** 初始化系统预定义角色及默认权限 */
  private async seedRoles() {
    const defaults: Record<string, string[]> = {
      admin: AdminService.PERMISSION_CATALOG.map((p) => p.code),
      editor: [
        'dashboard:view', 'user:view', 'activity:view', 'activity:manage',
        'business:view', 'business:manage', 'product:manage', 'category:manage',
      ],
      moderator: ['dashboard:view', 'user:view', 'activity:view', 'activity:audit', 'business:view', 'business:audit'],
      operator: [
        'dashboard:view', 'user:view', 'order:view', 'order:manage', 'vip:manage',
        'coupon:manage', 'point:manage', 'message:manage', 'banner:manage',
        'announcement:manage', 'version:manage',
      ],
      user: [],
    };
    const meta: Record<string, { name: string; description: string; isSystem: number; sortOrder: number }> = {
      admin: { name: '管理员', description: '拥有后台全部管理权限', isSystem: 1, sortOrder: 1 },
      editor: { name: '内容编辑', description: '可管理活动、商机、商品等内容', isSystem: 1, sortOrder: 2 },
      moderator: { name: '审核员', description: '可审核活动、商机等提交内容', isSystem: 1, sortOrder: 3 },
      operator: { name: '运营', description: '可管理优惠券、积分、订单、消息等运营功能', isSystem: 1, sortOrder: 4 },
      user: { name: '普通用户', description: '基础浏览权限', isSystem: 1, sortOrder: 5 },
    };
    for (const code of Object.keys(defaults)) {
      await this.prisma.adminRole.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: meta[code]?.name || code,
          description: meta[code]?.description || '',
          permissions: JSON.stringify(Array.isArray(defaults[code]) ? defaults[code] : []),
          isSystem: meta[code]?.isSystem ?? 0,
          sortOrder: meta[code]?.sortOrder ?? 0,
        },
      });
    }
  }

  private parsePermissions(raw: string): string[] {
    try {
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // ============== 操作日志 ==============
  async logOperation(operator: any, module: string, action: string, detail: string, ip: string) {
    try {
      let operatorId = operator?.userId || operator?.id || 0;
      let operatorName = String(operator?.username || operator?.nickname || '');
      // @CurrentUser 仅含 userId，需回查用户名
      if (!operatorName && operatorId) {
        const u = await this.prisma.user.findUnique({ where: { id: operatorId }, select: { nickname: true } });
        operatorName = u?.nickname || `#${operatorId}`;
      }
      await this.prisma.operationLog.create({
        data: {
          operatorId,
          operator: operatorName,
          module,
          action,
          detail,
          ip: ip || '',
        },
      });
    } catch (e) {
      // 日志失败不影响主流程
      console.error('[OperationLog] 写入失败:', e);
    }
  }

  async getOperationLogs(params: { page?: number; size?: number; keyword?: string; module?: string }) {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const where: any = {};
    if (params.keyword) {
      where.OR = [{ operator: { contains: params.keyword } }, { detail: { contains: params.keyword } }, { action: { contains: params.keyword } }];
    }
    if (params.module) where.module = params.module;
    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);
    return { list, total, page, size };
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
    // 积分购买配置数值化
    payload.pointsEnabled = Number(payload.pointsEnabled) || 0;
    payload.pointsPrice = Math.floor(Number(payload.pointsPrice) || 0);
    payload.pointsMinLimit = Math.floor(Number(payload.pointsMinLimit) || 0);
    payload.pointsMaxLimit = Math.floor(Number(payload.pointsMaxLimit) || 0);
    payload.pointsRate = Math.floor(Number(payload.pointsRate) || 100);
    payload.pointsRatioPercent = Number(payload.pointsRatioPercent) || 0;
    payload.pointsMaxDeduct = Number(payload.pointsMaxDeduct) || 0;
    payload.pointsDeductMode = payload.pointsDeductMode === 'ratio' ? 'ratio' : 'fixed';
    return this.prisma.product.create({ data: payload });
  }

  async updateProduct(id: number, data: any) {
    const payload: any = { ...data };
    delete payload.id;
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    if (payload.images && typeof payload.images !== 'string') payload.images = JSON.stringify(payload.images);
    if (payload.specs && typeof payload.specs !== 'string') payload.specs = JSON.stringify(payload.specs);
    if (payload.pointsEnabled !== undefined) payload.pointsEnabled = Number(payload.pointsEnabled) || 0;
    if (payload.pointsPrice !== undefined) payload.pointsPrice = Math.floor(Number(payload.pointsPrice) || 0);
    if (payload.pointsMinLimit !== undefined) payload.pointsMinLimit = Math.floor(Number(payload.pointsMinLimit) || 0);
    if (payload.pointsMaxLimit !== undefined) payload.pointsMaxLimit = Math.floor(Number(payload.pointsMaxLimit) || 0);
    if (payload.pointsRate !== undefined) payload.pointsRate = Math.floor(Number(payload.pointsRate) || 100);
    if (payload.pointsRatioPercent !== undefined) payload.pointsRatioPercent = Number(payload.pointsRatioPercent) || 0;
    if (payload.pointsMaxDeduct !== undefined) payload.pointsMaxDeduct = Number(payload.pointsMaxDeduct) || 0;
    if (payload.pointsDeductMode !== undefined) payload.pointsDeductMode = payload.pointsDeductMode === 'ratio' ? 'ratio' : 'fixed';
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
