import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequirePermissions(Permission.CATALOG_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.productService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.CATALOG_WRITE)
  create(@Body() payload: CreateProductDto) {
    return this.productService.create(payload);
  }
}
