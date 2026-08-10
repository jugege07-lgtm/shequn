import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 权限码守卫：优先校验 @Permissions() 声明的权限码。
 * - 未声明权限码 → 放行（由 RolesGuard 负责角色判断）
 * - 用户角色含 admin → 拥有全部权限，直接放行
 * - 否则读取该用户所有角色的权限码（AdminRole.permissions），必须有全部所需权限才放行
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    // 未声明权限码的接口不做权限码校验
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('未登录或登录已过期');
    }

    // 管理员角色拥有全部权限
    const roles = String(user.role || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (roles.includes('admin')) {
      return true;
    }

    // 从数据库读取这些角色配置的权限码（不在数据库中的角色视为无此权限）
    const roleRows = await this.prisma.adminRole.findMany({
      where: { code: { in: roles } },
      select: { permissions: true },
    });
    const owned = new Set<string>();
    for (const row of roleRows) {
      try {
        const perms = JSON.parse(row.permissions || '[]');
        if (Array.isArray(perms)) {
          perms.forEach((p: string) => owned.add(p));
        }
      } catch {
        // 忽略权限 JSON 解析异常
      }
    }
    const missing = required.filter((p) => !owned.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException('当前账号没有该操作的权限');
    }
    return true;
  }
}