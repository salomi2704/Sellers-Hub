import { Injectable } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantRepository {
  constructor(private readonly tenantContext: TenantContextService) {}

  scope() {
    const tenant = this.tenantContext.getTenant();
    return {
      sellerId: tenant.sellerId,
      storeId: tenant.storeId,
      correlationId: tenant.correlationId,
      userId: tenant.userId,
    };
  }
}
