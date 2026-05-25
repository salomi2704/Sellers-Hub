import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { MinioService } from '../infrastructure/storage/minio.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioService,
  ) {}

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
        minio,
      },
    };
  }
}
