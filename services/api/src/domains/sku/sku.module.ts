import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';

@Module({
  controllers: [SkuController],
  providers: [SkuService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class SkuModule {}
