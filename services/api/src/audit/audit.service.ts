import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

type AuditLogWriter = {
  auditLog: {
    create: (args: {
      data: {
        sellerId: string;
        storeId: string;
        userId?: string;
        entityType: string;
        entityId: string;
        action: string;
        correlationId: string;
        metadata?: Prisma.InputJsonValue;
      };
    }) => Promise<unknown>;
  };
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    params: {
      sellerId: string;
      storeId: string;
      userId?: string;
      entityType: string;
      entityId: string;
      action: string;
      correlationId: string;
      metadata?: Record<string, unknown>;
    },
    writer?: AuditLogWriter,
  ) {
    const client = writer ?? this.prisma;
    await client.auditLog.create({
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
