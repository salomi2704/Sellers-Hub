export type Role =
  | 'OWNER'
  | 'MANAGER'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'SUPPORT'
  | 'ADMIN';

export type Permission =
  | 'catalog:read'
  | 'catalog:write'
  | 'orders:read'
  | 'orders:manage'
  | 'shipments:manage'
  | 'finance:read'
  | 'finance:write'
  | 'users:manage'
  | 'admin:read';

export const hasPermission = (
  permissions: string[],
  permission: Permission,
): boolean => permissions.includes(permission);

export const canAccessAdmin = (
  role: Role,
  permissions: string[],
): boolean => role === 'ADMIN' || hasPermission(permissions, 'admin:read');
