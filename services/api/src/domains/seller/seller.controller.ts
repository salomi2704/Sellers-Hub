import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AllowRoles } from '../../common/decorators/rbac.decorator';
import { Role } from '../../common/enums/role.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { SellerService } from './seller.service';

@ApiTags('sellers')
@ApiBearerAuth()
@Controller({ path: 'sellers', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('me')
  @AllowRoles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  me() {
    return this.sellerService.me();
  }
}
