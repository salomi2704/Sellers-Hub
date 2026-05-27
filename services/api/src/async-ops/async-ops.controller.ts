import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/rbac.decorator';
import { Permission } from '../common/enums/permission.enum';
import { RbacGuard } from '../common/guards/rbac.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantRepository } from '../common/tenant-repository';
import { AnalyticsService } from './analytics/analytics.service';
import { IngestAnalyticsEventsDto } from './analytics/dto/ingest-analytics-events.dto';
import { CreateMediaJobDto } from './media/dto/create-media-job.dto';
import { MediaService } from './media/media.service';

@ApiTags('async-ops')
@ApiBearerAuth()
@Controller({ path: 'async-ops', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AsyncOpsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly mediaService: MediaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  @Post('analytics/ingest')
  @RequirePermissions(Permission.ADMIN_READ)
  enqueueAnalytics(@Body() payload: IngestAnalyticsEventsDto) {
    const scope = this.tenantRepository.scope();
    return this.analyticsService.enqueue(
      payload.events.map((event) => ({
        ...event,
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        correlationId: scope.correlationId,
      })),
    );
  }

  @Post('media/process')
  @RequirePermissions(Permission.CATALOG_WRITE)
  enqueueMedia(@Body() payload: CreateMediaJobDto) {
    const scope = this.tenantRepository.scope();
    return this.mediaService.enqueueProcess({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      sourceObjectKey: payload.sourceObjectKey,
      destinationPrefix: payload.destinationPrefix,
      correlationId: scope.correlationId,
    });
  }
}
