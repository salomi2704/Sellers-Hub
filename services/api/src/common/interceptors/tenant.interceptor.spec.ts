import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { TenantContextService } from '../tenant-context.service';
import { TenantInterceptor } from './tenant.interceptor';

describe('TenantInterceptor', () => {
  const next: CallHandler = { handle: () => of('ok') };

  it('rejects cross-tenant header overrides for authenticated users', () => {
    const tenantContext = {
      setTenant: jest.fn(),
    } as unknown as TenantContextService;
    const interceptor = new TenantInterceptor(tenantContext);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-seller-id': 'seller-2', 'x-store-id': 'store-2' },
          user: { sellerId: 'seller-1', storeId: 'store-1', sub: 'u1' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => interceptor.intercept(context, next)).toThrow(
      ForbiddenException,
    );
  });

  it('uses authenticated tenant scope when headers are absent', () => {
    const setTenant = jest.fn();
    const tenantContext = { setTenant } as unknown as TenantContextService;
    const interceptor = new TenantInterceptor(tenantContext);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          user: { sellerId: 'seller-1', storeId: 'store-1', sub: 'u1' },
        }),
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, next);
    expect(setTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerId: 'seller-1',
        storeId: 'store-1',
        userId: 'u1',
      }),
    );
  });
});
