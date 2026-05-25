import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [AuditModule],
  controllers: [ProductController],
  providers: [ProductService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class ProductModule {}
