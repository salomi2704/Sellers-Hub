import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum';
import { Role } from '../enums/role.enum';

export const ROLE_KEY = 'allowedRoles';
export const PERMISSION_KEY = 'requiredPermissions';

export const AllowRoles = (...roles: Role[]) => SetMetadata(ROLE_KEY, roles);
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
