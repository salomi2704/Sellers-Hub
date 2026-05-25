import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [AuditModule, QueueModule],
  controllers: [SettlementController],
  providers: [SettlementService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class SettlementModule {}
