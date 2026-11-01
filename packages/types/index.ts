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

export interface AnalyticsEvent {
  id: string;
  type: string;
  sellerId: string;
  storeId: string;
  timestamp: string;
  payload: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
