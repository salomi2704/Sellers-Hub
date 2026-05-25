import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [AuditModule],
  controllers: [TransactionController],
  providers: [TransactionService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class TransactionModule {}
