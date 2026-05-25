import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenant-context.service';
import { TenantRepository } from '../../common/tenant-repository';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService, TenantContextService, TenantRepository, TenantInterceptor, RbacGuard],
})
export class StoreModule {}
