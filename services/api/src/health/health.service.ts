import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, register } from 'prom-client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { QueueService } from '../infrastructure/queue/queue.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { MinioService } from '../infrastructure/storage/minio.service';

@Injectable()
export class HealthService {
  private static metricsInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: QueueService,
    private readonly minio: MinioService,
  ) {
    if (!HealthService.metricsInitialized) {
      collectDefaultMetrics();
      HealthService.metricsInitialized = true;
    }
  }

  liveness() {
    return { status: 'ok', service: 'wysh-sellers-api' };
  }

  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    const redisPing = await this.redis.ping();
    const minio = await this.minio.readinessCheck();

    return {
      status: 'ok',
      checks: {
        postgres: 'ok',
        redis: redisPing === 'PONG' ? 'ok' : 'error',
        queue: this.queue.readinessCheck(),
        minio,
      },
    };
  }

  async metrics() {
    return {
      contentType: register.contentType,
      payload: await register.metrics(),
    };
  }
}
