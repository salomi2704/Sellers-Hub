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
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TenantContextService } from '../tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: JwtPayload;
      correlationId?: string;
    }>();

    const sellerId = this.first(request.headers['x-seller-id']);
    const storeId = this.first(request.headers['x-store-id']);
    const correlationId = request.correlationId ?? this.first(request.headers['x-correlation-id']) ?? randomUUID();

    if (request.user?.sellerId && request.user?.storeId) {
      if (
        (sellerId && sellerId !== request.user.sellerId) ||
        (storeId && storeId !== request.user.storeId)
      ) {
        throw new ForbiddenException('Cross-tenant access attempt rejected.');
      }

      this.tenantContext.setTenant({
        sellerId: request.user.sellerId,
        storeId: request.user.storeId,
        correlationId,
        userId: request.user.sub,
      });
      return next.handle();
    }

    if (sellerId && storeId) {
      this.tenantContext.setTenant({ sellerId, storeId, correlationId });
      return next.handle();
    }

    throw new ForbiddenException('Missing tenant headers.');
  }

  private first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
