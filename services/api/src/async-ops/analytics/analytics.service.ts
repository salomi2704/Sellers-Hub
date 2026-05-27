import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  AnalyticsIngestionItem,
  AnalyticsIngestionJobPayload,
} from '../../infrastructure/queue/queue.jobs';
import { QueueService } from '../../infrastructure/queue/queue.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async enqueue(events: AnalyticsIngestionItem[]) {
    if (events.length === 0) {
      return { queued: 0 };
    }
    await this.queue.enqueueAnalyticsIngestion({ events });
    return { queued: events.length };
  }

  async ingest(payload: AnalyticsIngestionJobPayload) {
    const rows = payload.events.map((event) => ({
      sellerId: event.sellerId,
      storeId: event.storeId,
      eventType: event.eventType,
      idempotencyKey: event.idempotencyKey,
      metadata: event.metadata as Prisma.InputJsonValue | undefined,
    }));

    if (rows.length === 0) {
      return { inserted: 0, totals: {} };
    }

    const inserted = await this.prisma.analyticsEvent.createMany({
      data: rows,
      skipDuplicates: true,
    });

    const totals = payload.events.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.eventType] = (acc[item.eventType] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return { inserted: inserted.count, totals };
  }
}
