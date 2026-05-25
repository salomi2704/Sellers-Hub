import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { RequestUser } from './request-user.interface';
import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: RequestUser;
      correlationId?: string;
    }>();

    const sellerHeader = request.headers['x-seller-id'];
    const storeHeader = request.headers['x-store-id'];
    const sellerId = Array.isArray(sellerHeader)
      ? sellerHeader[0]
      : sellerHeader;
    const storeId = Array.isArray(storeHeader) ? storeHeader[0] : storeHeader;
    const correlationId = Array.isArray(request.headers['x-correlation-id'])
      ? request.headers['x-correlation-id'][0]
      : (request.headers['x-correlation-id'] ?? randomUUID());

    if (request.user?.sellerId && request.user?.storeId) {
      if (
        (sellerId && sellerId !== request.user.sellerId) ||
        (storeId && storeId !== request.user.storeId)
      ) {
        throw new ForbiddenException('Cross-tenant access attempt rejected.');
      }

      this.tenantContext.setTenant(
        request.user.sellerId,
        request.user.storeId,
        correlationId,
      );
      request.correlationId = correlationId;
      return next.handle();
    }

    if (sellerId && storeId) {
      this.tenantContext.setTenant(sellerId, storeId, correlationId);
      request.correlationId = correlationId;
    }

    return next.handle();
  }
}
