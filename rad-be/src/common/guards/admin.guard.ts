import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_KEY, SUPER_USER_KEY } from '../decorators/admin-required.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {

    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiresSuperUser = this.reflector.getAllAndOverride<boolean>(SUPER_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);


    if (!requiresAdmin && !requiresSuperUser) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.disabled) {
      throw new ForbiddenException('Account is disabled');
    }

    // Super users can do everything (both admin and super user operations)
    if (user.role === 'super_user') {
      return true;
    }

    // For super user required endpoints, only super users can access
    if (requiresSuperUser) {
      throw new ForbiddenException('Super user role required');
    }

    // For admin required endpoints, admins can access (super users already handled above)
    if (requiresAdmin && user.role === 'admin') {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
