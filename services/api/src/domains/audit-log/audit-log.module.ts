import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class AuditLogModule {}
