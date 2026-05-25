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
    this.reconciliationQueue = new Queue('reconciliation', { connection });
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
      attempts: 3,
    });
  }
}
