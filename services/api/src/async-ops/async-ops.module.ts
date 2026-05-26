import { Global, Module } from '@nestjs/common';
import { RbacGuard } from '../common/guards/rbac.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantContextService } from '../common/tenant-context.service';
import { TenantRepository } from '../common/tenant-repository';
import { AsyncOpsController } from './async-ops.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { MediaService } from './media/media.service';
import { QueueWorkersService } from './queue-workers.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';

@Global()
@Module({
  controllers: [AsyncOpsController, WebhookController],
  providers: [
    AnalyticsService,
    MediaService,
    ReconciliationService,
    WebhookService,
    QueueWorkersService,
    TenantContextService,
    TenantRepository,
    TenantInterceptor,
    RbacGuard,
  ],
  exports: [WebhookService, QueueWorkersService],
})
export class AsyncOpsModule {}
