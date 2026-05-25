import type { TenantScope } from '../types';

export const buildTenantKey = ({ sellerId, storeId }: TenantScope) => `${sellerId}:${storeId}`;

export const paginate = <T>(items: T[], page: number, pageSize: number) => ({
  data: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  total: items.length,
});
