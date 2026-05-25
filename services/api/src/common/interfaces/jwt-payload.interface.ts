import { Permission } from '../enums/permission.enum';
import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  sellerId: string;
  storeId: string;
  role: Role;
  permissions: Permission[];
  type: 'access' | 'refresh';
}
