import { Global, Module } from '@nestjs/common';
import { QueueMetricsService } from './queue.metrics.service';
import { QueueService } from './queue.service';

@Global()
@Module({
  providers: [QueueService, QueueMetricsService],
  exports: [QueueService, QueueMetricsService],
})
export class QueueModule {}
