import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission =
      this.reflector.get<string>(PERMISSION_KEY, context.getHandler()) ??
      this.reflector.get<string>(PERMISSION_KEY, context.getClass());
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (user.is_super_admin === true) {
      return true;
    }

    const permissions: Set<string> = user.permissionsSet ?? new Set(user.permissions ?? []);
    if (permissions.has(requiredPermission)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
