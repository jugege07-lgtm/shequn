import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 全局操作日志拦截器
 * - 自动记录所有对 /api/admin/* 的增删改（POST/PUT/PATCH/DELETE）请求
 * - 根据路由映射生成可读的中文操作详情，写入 OperationLog 表
 * - 已被 AdminService.logOperation 显式记录的后台账号/角色权限操作会跳过，避免重复记录
 * - 日志写入失败不影响主流程
 */
const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** 已由 AdminService 显式记录的路由前缀（避免重复） */
const SKIP_PREFIXES = [
  '/api/admin/staff',
  '/api/admin/roles',
  '/api/admin/role-permissions',
  '/api/admin/profile/password',
];

interface Rule {
  /** 匹配路径（正则，已匹配 res 与 id 段） */
  re: RegExp;
  method: string;
  module: string;
  action: string;
  /** @param id 资源 id（若有） */
  detail: (id?: string) => string;
}

const RULES: Rule[] = [
  // ===== 系统配置 =====
  { re: /^\/api\/admin\/configs$/, method: 'POST', module: 'system', action: 'update_config', detail: () => '保存系统基础配置' },
  { re: /^\/api\/admin\/config\/[^/]+$/, method: 'PUT', module: 'system', action: 'update_config', detail: () => '更新系统配置项' },
  { re: /^\/api\/admin\/config\/[^/]+$/, method: 'DELETE', module: 'system', action: 'delete_config', detail: () => '删除系统配置项' },
  { re: /^\/api\/admin\/payment-config$/, method: 'PUT', module: 'system', action: 'update_payment_config', detail: () => '更新支付配置' },
  // ===== Banner =====
  { re: /^\/api\/admin\/banners$/, method: 'POST', module: 'system', action: 'create_banner', detail: () => '新增轮播Banner' },
  { re: /^\/api\/admin\/banners\/\d+$/, method: 'PUT', module: 'system', action: 'update_banner', detail: (id) => `编辑轮播Banner（ID ${id}）` },
  { re: /^\/api\/admin\/banners\/\d+$/, method: 'DELETE', module: 'system', action: 'delete_banner', detail: (id) => `删除轮播Banner（ID ${id}）` },
  // ===== 公告 =====
  { re: /^\/api\/admin\/announcements$/, method: 'POST', module: 'system', action: 'create_announcement', detail: () => '新增公告' },
  { re: /^\/api\/admin\/announcements\/\d+$/, method: 'PUT', module: 'system', action: 'update_announcement', detail: (id) => `编辑公告（ID ${id}）` },
  { re: /^\/api\/admin\/announcements\/\d+$/, method: 'DELETE', module: 'system', action: 'delete_announcement', detail: (id) => `删除公告（ID ${id}）` },
  // ===== 版本 =====
  { re: /^\/api\/admin\/versions$/, method: 'POST', module: 'system', action: 'create_version', detail: () => '新增版本' },
  { re: /^\/api\/admin\/versions\/\d+$/, method: 'PUT', module: 'system', action: 'update_version', detail: (id) => `编辑版本（ID ${id}）` },
  { re: /^\/api\/admin\/versions\/\d+$/, method: 'DELETE', module: 'system', action: 'delete_version', detail: (id) => `删除版本（ID ${id}）` },
  // ===== 通知 =====
  { re: /^\/api\/admin\/notifications/, method: 'POST', module: 'system', action: 'create_notification', detail: () => '发送通知消息' },
  // ===== 用户 =====
  { re: /^\/api\/admin\/users\/\d+\/disable$/, method: 'PUT', module: 'user', action: 'disable_user', detail: (id) => `禁用用户（ID ${id}）` },
  { re: /^\/api\/admin\/users\/\d+\/enable$/, method: 'PUT', module: 'user', action: 'enable_user', detail: (id) => `启用用户（ID ${id}）` },
  { re: /^\/api\/admin\/users\/\d+\/password$/, method: 'PUT', module: 'user', action: 'reset_user_password', detail: (id) => `重置用户密码（ID ${id}）` },
  { re: /^\/api\/admin\/users\/\d+\/roles$/, method: 'PUT', module: 'user', action: 'update_user_roles', detail: (id) => `修改用户角色（ID ${id}）` },
  { re: /^\/api\/admin\/users\/\d+$/, method: 'PUT', module: 'user', action: 'update_user', detail: (id) => `编辑用户（ID ${id}）` },
  { re: /^\/api\/admin\/users\/\d+$/, method: 'DELETE', module: 'user', action: 'delete_user', detail: (id) => `删除用户（ID ${id}）` },
  // ===== 活动 =====
  { re: /^\/api\/admin\/activities\/clear-signups$/, method: 'POST', module: 'activity', action: 'clear_signups', detail: () => '清空活动报名数据' },
  { re: /^\/api\/admin\/activities\/\d+\/approve$/, method: 'PUT', module: 'activity', action: 'approve_activity', detail: (id) => `审核通过活动（ID ${id}）` },
  { re: /^\/api\/admin\/activities\/\d+\/reject$/, method: 'PUT', module: 'activity', action: 'reject_activity', detail: (id) => `驳回活动（ID ${id}）` },
  { re: /^\/api\/admin\/activities\/\d+\/signups$/, method: 'DELETE', module: 'activity', action: 'clear_signups', detail: (id) => `清空活动报名（活动ID ${id}）` },
  { re: /^\/api\/admin\/activities$/, method: 'POST', module: 'activity', action: 'create_activity', detail: () => '发布活动' },
  { re: /^\/api\/admin\/activities\/\d+$/, method: 'PUT', module: 'activity', action: 'update_activity', detail: (id) => `编辑活动（ID ${id}）` },
  { re: /^\/api\/admin\/activities\/\d+$/, method: 'DELETE', module: 'activity', action: 'delete_activity', detail: (id) => `删除活动（ID ${id}）` },
  // ===== 商机 =====
  { re: /^\/api\/admin\/businesses\/\d+\/approve$/, method: 'PUT', module: 'business', action: 'approve_business', detail: (id) => `审核通过商机（ID ${id}）` },
  { re: /^\/api\/admin\/businesses\/\d+\/reject$/, method: 'PUT', module: 'business', action: 'reject_business', detail: (id) => `驳回商机（ID ${id}）` },
  { re: /^\/api\/admin\/businesses\/\d+\/status$/, method: 'PUT', module: 'business', action: 'update_business_status', detail: (id) => `更新商机状态（ID ${id}）` },
  { re: /^\/api\/admin\/businesses$/, method: 'POST', module: 'business', action: 'create_business', detail: () => '发布商机' },
  { re: /^\/api\/admin\/businesses\/\d+$/, method: 'PUT', module: 'business', action: 'update_business', detail: (id) => `编辑商机（ID ${id}）` },
  { re: /^\/api\/admin\/businesses\/\d+$/, method: 'DELETE', module: 'business', action: 'delete_business', detail: (id) => `删除商机（ID ${id}）` },
  // 商机分类
  { re: /^\/api\/admin\/business-categories$/, method: 'POST', module: 'business', action: 'create_category', detail: () => '新增商机分类' },
  { re: /^\/api\/admin\/business-categories\/\d+$/, method: 'PUT', module: 'business', action: 'update_category', detail: (id) => `编辑商机分类（ID ${id}）` },
  { re: /^\/api\/admin\/business-categories\/\d+$/, method: 'DELETE', module: 'business', action: 'delete_category', detail: (id) => `删除商机分类（ID ${id}）` },
  { re: /^\/api\/admin\/business-category-list$/, method: 'POST', module: 'business', action: 'create_category', detail: () => '新增商机分类' },
  { re: /^\/api\/admin\/business-category-list\/\d+$/, method: 'PUT', module: 'business', action: 'update_category', detail: (id) => `编辑商机分类（ID ${id}）` },
  { re: /^\/api\/admin\/business-category-list\/\d+$/, method: 'DELETE', module: 'business', action: 'delete_category', detail: (id) => `删除商机分类（ID ${id}）` },
  // ===== 商品 =====
  { re: /^\/api\/admin\/products\/\d+\/status$/, method: 'PUT', module: 'product', action: 'update_product_status', detail: (id) => `更新商品状态（ID ${id}）` },
  { re: /^\/api\/admin\/products$/, method: 'POST', module: 'product', action: 'create_product', detail: () => '发布商品' },
  { re: /^\/api\/admin\/products\/\d+$/, method: 'PUT', module: 'product', action: 'update_product', detail: (id) => `编辑商品（ID ${id}）` },
  { re: /^\/api\/admin\/products\/\d+$/, method: 'DELETE', module: 'product', action: 'delete_product', detail: (id) => `删除商品（ID ${id}）` },
  { re: /^\/api\/admin\/product-categories$/, method: 'POST', module: 'product', action: 'create_category', detail: () => '新增商品分类' },
  { re: /^\/api\/admin\/product-categories\/\d+$/, method: 'PUT', module: 'product', action: 'update_category', detail: (id) => `编辑商品分类（ID ${id}）` },
  { re: /^\/api\/admin\/product-categories\/\d+$/, method: 'DELETE', module: 'product', action: 'delete_category', detail: (id) => `删除商品分类（ID ${id}）` },
  // ===== 订单 =====
  { re: /^\/api\/admin\/orders\/\d+\/ship$/, method: 'PUT', module: 'order', action: 'ship_order', detail: (id) => `订单发货（订单 ${id}）` },
  { re: /^\/api\/admin\/orders\/\d+\/approve-refund$/, method: 'PUT', module: 'order', action: 'approve_refund', detail: (id) => `同意订单退款（订单 ${id}）` },
  { re: /^\/api\/admin\/orders\/\d+\/reject-refund$/, method: 'PUT', module: 'order', action: 'reject_refund', detail: (id) => `拒绝订单退款（订单 ${id}）` },
  // ===== VIP套餐 =====
  { re: /^\/api\/admin\/vip-plans$/, method: 'POST', module: 'system', action: 'create_vip_plan', detail: () => '新增VIP套餐' },
  { re: /^\/api\/admin\/vip-plans\/\d+\/status$/, method: 'PUT', module: 'system', action: 'update_vip_plan_status', detail: (id) => `更新VIP套餐状态（ID ${id}）` },
  { re: /^\/api\/admin\/vip-plans\/\d+$/, method: 'PUT', module: 'system', action: 'update_vip_plan', detail: (id) => `编辑VIP套餐（ID ${id}）` },
  { re: /^\/api\/admin\/vip-plans\/\d+$/, method: 'DELETE', module: 'system', action: 'delete_vip_plan', detail: (id) => `删除VIP套餐（ID ${id}）` },
  // ===== 余额调整 =====
  { re: /^\/api\/admin\/balance\/adjust$/, method: 'POST', module: 'user', action: 'adjust_balance', detail: () => '调整用户余额' },
];

const METHOD_LABEL: Record<string, string> = {
  POST: '新增',
  PUT: '更新',
  PATCH: '更新',
  DELETE: '删除',
};

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = String(req.method || '').toUpperCase();
    const path: string = String(req.path || req.url || '');
    // 仅记录 /api/admin/* 的增删改请求
    if (!MUTATING.includes(method) || !path.startsWith('/api/admin/')) {
      return next.handle();
    }
    // 已由 AdminService 显式记录的路由跳过
    if (SKIP_PREFIXES.some((p) => path.startsWith(p))) {
      return next.handle();
    }
    return next.handle().pipe(
      tap(() => {
        // 异步写入，失败不影响主流程
        this.log(req, method, path).catch((e) => console.error('[OperationLog] 写入失败:', e));
      }),
    );
  }

  private ip(req: any): string {
    const fwd = req.headers?.['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || '';
  }

  private async log(req: any, method: string, path: string) {
    const user = req.user;
    if (!user) return;

    const idMatch = path.match(/\/(\d+)(?:\/|$)/);
    const id = idMatch ? idMatch[1] : undefined;
    const matched = RULES.find((r) => r.method === method && r.re.test(path));

    const module = matched?.module || this.guessModule(path);
    const action = matched?.action || `${method.toLowerCase()}_operation`;
    const detail = matched ? matched.detail(id) : this.genericDetail(method, path);

    let operatorId = Number(user.userId || user.id || 0);
    let operatorName = String(user.username || user.nickname || '');
    if (!operatorName && operatorId) {
      const u = await this.prisma.user.findUnique({
        where: { id: operatorId },
        select: { nickname: true },
      });
      operatorName = u?.nickname || `#${operatorId}`;
    }

    await this.prisma.operationLog.create({
      data: {
        operatorId,
        operator: operatorName,
        module,
        action,
        detail,
        ip: this.ip(req),
      },
    });
  }

  private guessModule(path: string): string {
    const segs = path.split('/').filter(Boolean);
    const res = segs[2] || '';
    if (res === 'users') return 'user';
    if (res === 'activities') return 'activity';
    if (res === 'businesses' || res === 'business-categories' || res === 'business-category-list') return 'business';
    if (res === 'products' || res === 'product-categories') return 'product';
    if (res === 'orders') return 'order';
    return 'system';
  }

  private genericDetail(method: string, path: string): string {
    const segs = path.split('/').filter(Boolean);
    const res = segs[2] || '';
    const label = res.replace(/s$/, '');
    return `${METHOD_LABEL[method] || method}${label}`;
  }
}