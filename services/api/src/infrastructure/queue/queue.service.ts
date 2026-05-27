import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JobsOptions, Queue, type ConnectionOptions } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { QueueName, QUEUE_NAMES } from './queue.constants';
import {
  AnalyticsIngestionJobPayload,
  EmitWebhookEventPayload,
  MediaProcessingJobPayload,
  ReconciliationJobPayload,
  WebhookDeadLetterPayload,
  WebhookDeliveryJobPayload,
} from './queue.jobs';
import { QueueMetricsService } from './queue.metrics.service';

const DEFAULT_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: 200,
  removeOnFail: 200,
};

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queues = new Map<QueueName, Queue>();

  constructor(
    private readonly redisService: RedisService,
    private readonly queueMetrics: QueueMetricsService,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const connection =
      this.redisService.getClient() as unknown as ConnectionOptions;
    (Object.values(QUEUE_NAMES) as QueueName[]).forEach((queueName) => {
      this.queues.set(
        queueName,
        new Queue(queueName, {
          connection,
          defaultJobOptions: DEFAULT_OPTIONS,
        }),
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );
  }

  getQueue(name: QueueName): Queue | undefined {
    return this.queues.get(name);
  }

  async enqueueReconciliation(
    payload: ReconciliationJobPayload,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.RECONCILIATION);
    if (!queue) {
      return;
    }
    await queue.add('reconciliation.run', payload);
    this.queueMetrics.markEnqueued(QUEUE_NAMES.RECONCILIATION);
  }

  async enqueueWebhookDelivery(
    payload: WebhookDeliveryJobPayload,
    opts?: JobsOptions,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.WEBHOOK_DELIVERY);
    if (!queue) {
      return;
    }
    await queue.add('webhook.delivery', payload, opts);
    this.queueMetrics.markEnqueued(QUEUE_NAMES.WEBHOOK_DELIVERY);
  }

  async enqueueWebhookDeadLetter(
    payload: WebhookDeadLetterPayload,
    opts?: JobsOptions,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.WEBHOOK_DEAD_LETTER);
    if (!queue) {
      return;
    }
    await queue.add('webhook.dead-letter', payload, opts);
    this.queueMetrics.markEnqueued(QUEUE_NAMES.WEBHOOK_DEAD_LETTER);
  }

  async enqueueAnalyticsIngestion(
    payload: AnalyticsIngestionJobPayload,
    opts?: JobsOptions,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.ANALYTICS_INGESTION);
    if (!queue) {
      return;
    }
    await queue.add('analytics.ingest', payload, opts);
    this.queueMetrics.markEnqueued(QUEUE_NAMES.ANALYTICS_INGESTION);
  }

  async enqueueMediaProcessing(
    payload: MediaProcessingJobPayload,
    opts?: JobsOptions,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.MEDIA_PROCESSING);
    if (!queue) {
      return;
    }
    await queue.add('media.process', payload, opts);
    this.queueMetrics.markEnqueued(QUEUE_NAMES.MEDIA_PROCESSING);
  }

  async scheduleReconciliationHeartbeat(): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.RECONCILIATION);
    if (!queue) {
      return;
    }
    await queue.upsertJobScheduler(
      'reconciliation-heartbeat',
      { every: 5 * 60 * 1000 },
      {
        name: 'reconciliation.schedule',
        data: {
          sellerId: '00000000-0000-0000-0000-000000000000',
          storeId: '00000000-0000-0000-0000-000000000000',
          runKey: `schedule-${randomUUID()}`,
          correlationId: randomUUID(),
          source: 'schedule',
        } satisfies ReconciliationJobPayload,
      },
    );
  }

  async enqueueWebhookEventDeliveryFanout(
    payload: EmitWebhookEventPayload,
  ): Promise<void> {
    const queue = this.queues.get(QUEUE_NAMES.WEBHOOK_DELIVERY);
    if (!queue) {
      return;
    }
    await queue.add('webhook.event.fanout', payload, { attempts: 3 });
    this.queueMetrics.markEnqueued(QUEUE_NAMES.WEBHOOK_DELIVERY);
  }

  async getQueueStats(): Promise<Record<string, unknown>> {
    if (process.env.NODE_ENV === 'test') {
      return { status: 'skipped' };
    }
    const stats = await Promise.all(
      Array.from(this.queues.entries()).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );
        return [name, counts] as const;
      }),
    );
    return Object.fromEntries(stats);
  }

  readinessCheck(): 'ok' | 'skipped' {
    if (process.env.NODE_ENV === 'test') {
      return 'skipped';
    }
    return this.queues.size > 0 ? 'ok' : 'skipped';
  }
}
