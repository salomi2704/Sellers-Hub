import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AllowRoles, RequirePermissions } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { TenantContextService } from '../common/tenant-context.service';
import { TenantInterceptor } from '../common/tenant.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsEventDto } from './dto/analytics-event.dto';
import { DiscoveryRequestDto } from './dto/discovery-request.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { PlatformService } from './platform.service';

@Controller({ path: '/', version: '1' })
@UseInterceptors(TenantInterceptor)
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('health/liveness')
  getLiveness() {
    return this.platformService.getLiveness();
  }

  @Get('health/readiness')
  getReadiness() {
    return this.platformService.getReadiness();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics() {
    const metrics = await this.platformService.getMetrics();
    return metrics.body;
  }

  @Get('onboarding/slug-availability')
  getSlugAvailability(@Query() query: SlugQueryDto) {
    return this.platformService.checkSlugAvailability(query.slug);
  }

  @Get('dashboard/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('OWNER', 'MANAGER', 'OPERATIONS', 'FINANCE', 'SUPPORT', 'ADMIN')
  getDashboardSummary() {
    const tenant = this.tenantContext.getTenant();
    return this.platformService.getDashboardSummary(
      tenant.sellerId,
      tenant.storeId,
    );
  }

  @Get('catalog/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('catalog:write')
  listProducts(@Query() query: PaginationQueryDto) {
    const tenant = this.tenantContext.getTenant();
    return this.platformService.listProducts(
      tenant.sellerId,
      tenant.storeId,
      query,
    );
  }

  @Post('catalog/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('catalog:write')
  createProduct(@Body() dto: CreateProductDto) {
    const tenant = this.tenantContext.getTenant();
    return this.platformService.createProduct(
      tenant.sellerId,
      tenant.storeId,
      dto,
    );
  }

  @Put('catalog/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('catalog:write')
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    const tenant = this.tenantContext.getTenant();
    return this.platformService.updateProduct(
      tenant.sellerId,
      tenant.storeId,
      productId,
      dto,
    );
  }

  @Delete('catalog/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('catalog:write')
  deleteProduct(@Param('productId') productId: string) {
    const tenant = this.tenantContext.getTenant();
    return this.platformService.deleteProduct(
      tenant.sellerId,
      tenant.storeId,
      productId,
    );
  }

  @Post('analytics/event')
  ingestAnalytics(@Body() payload: AnalyticsEventDto) {
    const tenant = this.safeTenant();
    return this.platformService.ingestAnalytics(
      payload,
      tenant?.sellerId,
      tenant?.storeId,
    );
  }

  @Post('discovery/search')
  discover(@Body() payload: DiscoveryRequestDto) {
    return this.platformService.discover(payload);
  }

  @Get('r/:offerId')
  @Redirect(undefined, 302)
  redirect(@Param('offerId') offerId: string) {
    return { url: this.platformService.getRedirect(offerId) };
  }

  private safeTenant() {
    try {
      return this.tenantContext.getTenant();
    } catch {
      return undefined;
    }
  }
}
