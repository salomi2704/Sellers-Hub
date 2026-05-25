import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { SettlementStatus, TransactionType } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementStatusDto } from './dto/update-settlement-status.dto';

const settlementTransitions: Record<SettlementStatus, SettlementStatus[]> = {
  PENDING: [SettlementStatus.PROCESSING, SettlementStatus.FAILED],
  PROCESSING: [SettlementStatus.COMPLETED, SettlementStatus.FAILED],
  COMPLETED: [],
  FAILED: [],
};

@Injectable()
export class SettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
    private readonly queue: QueueService,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();
    return this.prisma.settlement.findMany({
      where: { sellerId, storeId },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(payload: CreateSettlementDto) {
    const scope = this.tenantRepository.scope();

    const settlement = await this.prisma.settlement.create({
      data: {
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        amount: payload.amount,
        orderId: payload.orderId,
        status: SettlementStatus.PENDING,
      },
    });

    await this.queue.enqueueReconciliation({ settlementId: settlement.id });

    await this.audit.log({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      userId: scope.userId,
      entityType: 'Settlement',
      entityId: settlement.id,
      action: 'settlement.create',
      correlationId: scope.correlationId,
      metadata: { amount: payload.amount },
    });

    return settlement;
  }

  async updateStatus(id: string, payload: UpdateSettlementStatusDto) {
    const scope = this.tenantRepository.scope();
    const settlement = await this.prisma.settlement.findFirstOrThrow({
      where: { id, sellerId: scope.sellerId, storeId: scope.storeId },
    });

    if (!settlementTransitions[settlement.status].includes(payload.status)) {
      throw new BadRequestException(
        `Invalid settlement transition ${settlement.status} -> ${payload.status}`,
      );
    }

    if (payload.payoutIdempotencyKey) {
      const duplicate = await this.prisma.settlement.findFirst({
        where: {
          sellerId: scope.sellerId,
          storeId: scope.storeId,
          payoutIdempotencyKey: payload.payoutIdempotencyKey,
          NOT: { id: settlement.id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Duplicate payout idempotency key.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: payload.status,
          payoutIdempotencyKey: payload.payoutIdempotencyKey,
          settledAt: payload.status === SettlementStatus.COMPLETED ? new Date() : null,
        },
      });

      if (payload.status === SettlementStatus.COMPLETED) {
        await tx.transaction.create({
          data: {
            sellerId: scope.sellerId,
            storeId: scope.storeId,
            settlementId: settlement.id,
            type: TransactionType.PAYOUT,
            amount: settlement.amount,
            idempotencyKey: payload.payoutIdempotencyKey ?? `payout-${settlement.id}`,
          },
        });
      }

      await this.audit.log({
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        userId: scope.userId,
        entityType: 'Settlement',
        entityId: updated.id,
        action: 'settlement.status.update',
        correlationId: scope.correlationId,
        metadata: { from: settlement.status, to: payload.status },
      });

      return updated;
    });
  }
}
