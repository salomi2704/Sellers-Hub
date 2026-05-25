import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'allowedRoles';
export const PERMISSION_KEY = 'requiredPermissions';

export const AllowRoles = (...roles: string[]) => SetMetadata(ROLE_KEY, roles);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
