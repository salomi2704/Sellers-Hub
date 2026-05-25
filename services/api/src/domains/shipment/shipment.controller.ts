import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ShipmentService } from './shipment.service';

@ApiTags('shipments')
@ApiBearerAuth()
@Controller({ path: 'shipments', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get()
  @RequirePermissions(Permission.ORDERS_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.shipmentService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.SHIPMENTS_MANAGE)
  create(@Body() payload: CreateShipmentDto) {
    return this.shipmentService.create(payload);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.SHIPMENTS_MANAGE)
  updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateShipmentStatusDto,
  ) {
    return this.shipmentService.updateStatus(id, payload);
  }
}
