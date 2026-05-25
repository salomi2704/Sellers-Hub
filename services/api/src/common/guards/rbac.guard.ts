import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PERMISSION_KEY, ROLE_KEY } from '../decorators/rbac.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles && !permissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const roleAllowed = !roles || roles.includes(user.role);
    const permissionsAllowed =
      !permissions ||
      permissions.every((permission) =>
        user.permissions.includes(permission as never),
      );

    return roleAllowed && permissionsAllowed;
  }
}
