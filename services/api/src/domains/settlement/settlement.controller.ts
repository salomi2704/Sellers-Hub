import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementStatusDto } from './dto/update-settlement-status.dto';
import { SettlementService } from './settlement.service';

@ApiTags('settlements')
@ApiBearerAuth()
@Controller({ path: 'settlements', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @RequirePermissions(Permission.FINANCE_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.settlementService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.FINANCE_WRITE)
  create(@Body() payload: CreateSettlementDto) {
    return this.settlementService.create(payload);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.FINANCE_WRITE)
  updateStatus(@Param('id') id: string, @Body() payload: UpdateSettlementStatusDto) {
    return this.settlementService.updateStatus(id, payload);
  }
}
