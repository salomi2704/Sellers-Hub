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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @RequirePermissions(Permission.ORDERS_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.orderService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.ORDERS_MANAGE)
  create(@Body() payload: CreateOrderDto) {
    return this.orderService.create(payload);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.ORDERS_MANAGE)
  updateStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, payload);
  }
}
