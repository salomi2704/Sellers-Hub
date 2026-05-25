import {
  Body,
  Controller,
  Get,
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
import { CreateSkuDto } from './dto/create-sku.dto';
import { SkuService } from './sku.service';

@ApiTags('skus')
@ApiBearerAuth()
@Controller({ path: 'skus', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Get()
  @RequirePermissions(Permission.CATALOG_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.skuService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.CATALOG_WRITE)
  create(@Body() payload: CreateSkuDto) {
    return this.skuService.create(payload);
  }
}
