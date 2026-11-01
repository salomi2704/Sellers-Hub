import type { TenantScope } from '../types';

export const buildTenantKey = ({ sellerId, storeId }: TenantScope) => `${sellerId}:${storeId}`;

export const paginate = <T>(items: T[], page: number, pageSize: number) => ({
  data: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  total: items.length,
});

export const throttle = <T>(fn: (...args: any[]) => T, limit: number) => {
  let inFlight = false;
  return (...args: any[]) => {
    if (inFlight) return;
    inFlight = true;
    setTimeout(() => {
      inFlight = false;
    }, limit);
    return fn(...args);
  };
};

export const debounce = <T>(fn: (...args: any[]) => T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};
