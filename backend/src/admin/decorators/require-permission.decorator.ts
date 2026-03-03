import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * Require the given permission to access this route.
 * Use with PermissionGuard. AdminGuard must run first to attach user.role/permissions.
 */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
