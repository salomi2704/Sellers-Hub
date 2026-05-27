import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, QueueEvents, Worker, type ConnectionOptions } from 'bullmq';
import pino from 'pino';
import Redis from 'ioredis';
import { AnalyticsService } from './analytics/analytics.service';
import { MediaService } from './media/media.service';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { WebhookService } from './webhook/webhook.service';
import {
  QUEUE_NAMES,
  QueueName,
} from '../infrastructure/queue/queue.constants';
import {
  AnalyticsIngestionJobPayload,
  EmitWebhookEventPayload,
  MediaProcessingJobPayload,
  ReconciliationJobPayload,
  WebhookDeadLetterPayload,
  WebhookDeliveryJobPayload,
} from '../infrastructure/queue/queue.jobs';
import { QueueMetricsService } from '../infrastructure/queue/queue.metrics.service';
import { QueueService } from '../infrastructure/queue/queue.service';

@Injectable()
export class QueueWorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
  private readonly workers: Worker[] = [];
  private readonly queueEvents: QueueEvents[] = [];
  private readonly workerHealth: Partial<Record<QueueName, 'up' | 'down'>> = {};

  constructor(
    private readonly queueService: QueueService,
    private readonly queueMetrics: QueueMetricsService,
    private readonly webhookService: WebhookService,
    private readonly reconciliationService: ReconciliationService,
    private readonly analyticsService: AnalyticsService,
    private readonly mediaService: MediaService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.queueService.scheduleReconciliationHeartbeat();

    this.createWorker(QUEUE_NAMES.WEBHOOK_DELIVERY, async (job) => {
      if (job.name === 'webhook.event.fanout') {
        await this.webhookService.emitEvent(
          job.data as EmitWebhookEventPayload,
        );
        return;
      }

      const payload = job.data as WebhookDeliveryJobPayload;
      try {
        await this.webhookService.processDelivery(
          payload.deliveryId,
          payload.correlationId,
        );
      } catch (error) {
        if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
          await this.queueService.enqueueWebhookDeadLetter({
            deliveryId: payload.deliveryId,
            correlationId: payload.correlationId,
            reason:
              error instanceof Error
                ? error.message
                : 'unknown webhook failure',
          });
        }
        throw error;
      }
    });

    this.createWorker(QUEUE_NAMES.WEBHOOK_DEAD_LETTER, async (job) => {
      const payload = job.data as WebhookDeadLetterPayload;
      await this.webhookService.markDeadLetter(
        payload.deliveryId,
        payload.reason,
      );
      this.logger.error({
        queue: QUEUE_NAMES.WEBHOOK_DEAD_LETTER,
        correlationId: payload.correlationId,
        deliveryId: payload.deliveryId,
        reason: payload.reason,
      });
    });

    this.createWorker(QUEUE_NAMES.RECONCILIATION, async (job) => {
      const payload = job.data as ReconciliationJobPayload;
      await this.reconciliationService.run(payload);
    });

    this.createWorker(QUEUE_NAMES.ANALYTICS_INGESTION, async (job) => {
      const payload = job.data as AnalyticsIngestionJobPayload;
      await this.analyticsService.ingest(payload);
    });

    this.createWorker(QUEUE_NAMES.MEDIA_PROCESSING, async (job) => {
      const payload = job.data as MediaProcessingJobPayload;
      try {
        await this.mediaService.process(payload);
      } catch (error) {
        await this.mediaService.markFailed(
          payload.mediaJobId,
          error instanceof Error
            ? error.message
            : 'unknown media processing error',
        );
        throw error;
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(this.queueEvents.map((events) => events.close()));
  }

  readinessCheck() {
    if (process.env.NODE_ENV === 'test') {
      return 'skipped';
    }
    const allUp = Object.values(this.workerHealth).every(
      (status) => status === 'up',
    );
    return {
      status: allUp ? 'ok' : 'degraded',
      workers: this.workerHealth,
    };
  }

  private createWorker(
    queueName: QueueName,
    processor: (job: Job) => Promise<void>,
  ) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    }) as unknown as ConnectionOptions;
    const worker = new Worker(queueName, processor, {
      connection,
      concurrency: 5,
      lockDuration: 30_000,
      maxStalledCount: 2,
      stalledInterval: 30_000,
    });

    this.workerHealth[queueName] = 'up';
    this.queueMetrics.setWorkerActive(queueName, true);

    worker.on('failed', (job, error) => {
      this.queueMetrics.markProcessed(queueName, 'failed');
      this.logger.error({
        queue: queueName,
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        error: error.message,
      });
    });

    worker.on('completed', (job) => {
      this.queueMetrics.markProcessed(queueName, 'success');
      this.logger.info({
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
      });
    });

    worker.on('error', (error) => {
      this.workerHealth[queueName] = 'down';
      this.queueMetrics.setWorkerActive(queueName, false);
      this.logger.error({ queue: queueName, error: error.message });
    });

    const events = new QueueEvents(queueName, { connection });
    this.workers.push(worker);
    this.queueEvents.push(events);
  }
}
