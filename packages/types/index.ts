export type Role = 'OWNER' | 'MANAGER' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | 'ADMIN';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface TenantScope {
  sellerId: string;
  storeId: string;
}

export interface PermissionGrant extends TenantScope {
  role: Role;
  permissions: string[];
}
