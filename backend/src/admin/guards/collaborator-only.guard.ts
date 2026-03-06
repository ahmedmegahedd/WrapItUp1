import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CollaboratorOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }
    if (user.collaboratorId) {
      return true;
    }
    throw new ForbiddenException('Collaborator access required');
  }
}
