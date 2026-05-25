import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { TenantContextService } from '../common/tenant-context.service';
import { TenantInterceptor } from '../common/tenant.interceptor';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  controllers: [PlatformController],
  providers: [
    PlatformService,
    TenantContextService,
    TenantInterceptor,
    RolesGuard,
  ],
  exports: [PlatformService],
})
export class PlatformModule {}
