import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** 后台可登录角色（与管理端 VALID_ROLES / 前端后台角色保持一致） */
export const STAFF_ROLES = ['admin', 'editor', 'moderator', 'operator'] as const;

/** 判断用户是否拥有给定角色集合中的任意一个 */
export function hasAnyRole(user: any, required: string[]): boolean {
  if (!user) return false;
  const userRoles = String(user.role || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return required.some((r) => userRoles.includes(r));
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 同时检查方法级和类级的 @Roles() 元数据
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // 多角色以逗号分隔，需逐个匹配
    const allowed = hasAnyRole(user, roles);
    if (!allowed) {
      throw new ForbiddenException('当前账号没有该操作的权限');
    }
    return true;
  }
}