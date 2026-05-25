import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, ROLE_KEY } from './roles.decorator';
import { RequestUser } from './request-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!allowedRoles && !requiredPermissions) {
      return true;
    }

    if (!user) {
      return false;
    }

    const roleAllowed = !allowedRoles || allowedRoles.includes(user.role);
    const permissionsAllowed =
      !requiredPermissions ||
      requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      );

    return roleAllowed && permissionsAllowed;
  }
}
