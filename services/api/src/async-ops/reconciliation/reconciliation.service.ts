import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReconciliationJobPayload } from '../../infrastructure/queue/queue.jobs';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async run(payload: ReconciliationJobPayload) {
    if (
      payload.sellerId === '00000000-0000-0000-0000-000000000000' ||
      payload.storeId === '00000000-0000-0000-0000-000000000000'
    ) {
      return { skipped: true };
    }

    const duplicates = await this.prisma.$queryRaw<
      Array<{ payoutidempotencykey: string; count: bigint }>
    >(Prisma.sql`
      SELECT "payoutIdempotencyKey", COUNT(*) as count
      FROM "Settlement"
      WHERE "sellerId" = ${payload.sellerId}::uuid
        AND "storeId" = ${payload.storeId}::uuid
        AND "payoutIdempotencyKey" IS NOT NULL
      GROUP BY "payoutIdempotencyKey"
      HAVING COUNT(*) > 1
    `);

    const orphanedTransactions = await this.prisma.transaction.count({
      where: {
        sellerId: payload.sellerId,
        storeId: payload.storeId,
        settlementId: null,
        type: 'PAYOUT',
      },
    });

    const pendingSettlements = await this.prisma.settlement.count({
      where: {
        sellerId: payload.sellerId,
        storeId: payload.storeId,
        status: 'PENDING',
      },
    });

    const discrepancyCount = duplicates.length + orphanedTransactions;
    const summary = {
      duplicatePayoutKeys: duplicates.map((item) => ({
        payoutIdempotencyKey: item.payoutidempotencykey,
        count: Number(item.count),
      })),
      orphanedPayoutTransactions: orphanedTransactions,
      pendingSettlements,
      source: payload.source,
    };

    const report = await this.prisma.reconciliationReport.upsert({
      where: {
        sellerId_storeId_runKey: {
          sellerId: payload.sellerId,
          storeId: payload.storeId,
          runKey: payload.runKey,
        },
      },
      update: {},
      create: {
        sellerId: payload.sellerId,
        storeId: payload.storeId,
        runKey: payload.runKey,
        discrepancyCount,
        summary: summary,
      },
    });

    await this.audit.log({
      sellerId: payload.sellerId,
      storeId: payload.storeId,
      entityType: 'ReconciliationReport',
      entityId: report.id,
      action: 'reconciliation.run',
      correlationId: payload.correlationId,
      metadata: summary,
    });

    return report;
  }
}
