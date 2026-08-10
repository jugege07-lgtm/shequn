import { SetMetadata } from '@nestjs/common';

/**
 * 声明接口所需的权限码（配合 PermissionsGuard 使用）。
 * 示例：@Permissions('role:manage', 'staff:manage')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);