import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [AuditModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    TenantContextService,
    TenantRepository,
    TenantInterceptor,
    RbacGuard,
  ],
})
export class OrderModule {}
