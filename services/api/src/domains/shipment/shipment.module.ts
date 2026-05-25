import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';

@Module({
  imports: [AuditModule],
  controllers: [ShipmentController],
  providers: [
    ShipmentService,
    TenantContextService,
    TenantRepository,
    TenantInterceptor,
    RbacGuard,
  ],
})
export class ShipmentModule {}
