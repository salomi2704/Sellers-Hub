import { ForbiddenException, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private sellerId?: string;
  private storeId?: string;
  private correlationId?: string;
  private userId?: string;

  setTenant(params: {
    sellerId: string;
    storeId: string;
    correlationId: string;
    userId?: string;
  }) {
    this.sellerId = params.sellerId;
    this.storeId = params.storeId;
    this.correlationId = params.correlationId;
    this.userId = params.userId;
  }

  getTenant() {
    if (!this.sellerId || !this.storeId || !this.correlationId) {
      throw new ForbiddenException(
        'Tenant scope is required for this operation.',
      );
    }

    return {
      sellerId: this.sellerId,
      storeId: this.storeId,
      correlationId: this.correlationId,
      userId: this.userId,
    };
  }
}
