import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    sellerId: string;
    storeId: string;
    userId?: string;
    entityType: string;
    entityId: string;
    action: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        sellerId: params.sellerId,
        storeId: params.storeId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        correlationId: params.correlationId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
