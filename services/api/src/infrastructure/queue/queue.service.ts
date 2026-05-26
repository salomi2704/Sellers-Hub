import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private reconciliationQueue!: Queue;

  constructor(private readonly redisService: RedisService) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const connection = this.redisService.getClient();
    this.reconciliationQueue = new Queue('reconciliation', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.reconciliationQueue) {
      return;
    }
    await this.reconciliationQueue.close();
  }

  async enqueueReconciliation(payload: Record<string, unknown>): Promise<void> {
    if (!this.reconciliationQueue) {
      return;
    }
    await this.reconciliationQueue.add('reconciliation.run', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1_000 },
    });
  }

  readinessCheck(): 'ok' | 'skipped' {
    if (process.env.NODE_ENV === 'test') {
      return 'skipped';
    }
    return this.reconciliationQueue ? 'ok' : 'skipped';
  }
}
