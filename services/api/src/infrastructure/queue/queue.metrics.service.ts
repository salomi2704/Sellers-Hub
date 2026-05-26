import { Injectable } from '@nestjs/common';
import { Counter, Gauge } from 'prom-client';
import { QueueName } from './queue.constants';

@Injectable()
export class QueueMetricsService {
  private readonly enqueueTotal = new Counter({
    name: 'queue_jobs_enqueued_total',
    help: 'Total jobs enqueued by queue',
    labelNames: ['queue'],
  });

  private readonly processedTotal = new Counter({
    name: 'queue_jobs_processed_total',
    help: 'Total jobs processed by queue and status',
    labelNames: ['queue', 'status'],
  });

  private readonly activeWorkers = new Gauge({
    name: 'queue_workers_active',
    help: 'Worker health status by queue (1=up,0=down)',
    labelNames: ['queue'],
  });

  markEnqueued(queue: QueueName) {
    this.enqueueTotal.inc({ queue });
  }

  markProcessed(queue: QueueName, status: 'success' | 'failed') {
    this.processedTotal.inc({ queue, status });
  }

  setWorkerActive(queue: QueueName, active: boolean) {
    this.activeWorkers.set({ queue }, active ? 1 : 0);
  }
}
