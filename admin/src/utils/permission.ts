// 后台权限控制工具：基于当前登录用户的角色（roles 数组）判断菜单与操作权限
// 角色定义与后端 STAFF_ROLES / AdminService.VALID_ROLES 保持一致

export interface AdminUser {
  id: number
  nickname: string
  avatarUrl?: string
  phone?: string
  role?: string
  roles?: string[]
  adminLevel?: number
}

/** 读取当前登录后台用户（本地缓存） */
export function getAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem('admin_user')
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

/** 得到当前用户角色数组（兼容 roles 与 role 逗号字符串） */
export function currentRoles(): string[] {
  const user = getAdminUser()
  if (user?.roles && user.roles.length) return [...user.roles]
  return String(user?.role || '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** 深呼吸：判断当前用户是否拥有给定角色中的任意一个 */
export function hasAnyRole(required: string[]): boolean {
  if (!required || required.length === 0) return true
  const mine = currentRoles()
  return required.some((r) => mine.includes(r))
}

/** 是否管理员 */
export function isAdmin(): boolean {
  return hasAnyRole(['admin'])
}

/** 是否后台可登录角色（管理员/编辑/审核/运营） */
export function isStaff(): boolean {
  return hasAnyRole(['admin', 'editor', 'moderator', 'operator'])
}

/**
 * 菜单/页面可见性：声明该页面允许的角色列表。
 * 返回 true 表示当前用户可见。
 */
export function menuVisible(allowedRoles: string[]): boolean {
  return hasAnyRole(allowedRoles)
}

/** 退出登录时清理用户缓存 */
export function clearAdminUser(): void {
  localStorage.removeItem('admin_user')
}