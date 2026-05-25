import { ForbiddenException, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private sellerId?: string;
  private storeId?: string;
  private correlationId?: string;

  setTenant(sellerId: string, storeId: string, correlationId: string) {
    this.sellerId = sellerId;
    this.storeId = storeId;
    this.correlationId = correlationId;
  }

  getTenant() {
    if (!this.sellerId || !this.storeId) {
      throw new ForbiddenException(
        'Tenant scope is required for this operation.',
      );
    }

    return {
      sellerId: this.sellerId,
      storeId: this.storeId,
      correlationId: this.correlationId,
    };
  }
}
