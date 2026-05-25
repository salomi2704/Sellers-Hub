import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AllowRoles } from '../../common/decorators/rbac.decorator';
import { Role } from '../../common/enums/role.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { StoreService } from './store.service';

@ApiTags('stores')
@ApiBearerAuth()
@Controller({ path: 'stores', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('me')
  @AllowRoles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  me() {
    return this.storeService.me();
  }
}
