import { ConflictException } from '@nestjs/common';
import { SettlementStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { TenantRepository } from '../../common/tenant-repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { SettlementService } from './settlement.service';

describe('SettlementService', () => {
  it('enforces idempotent payout operations', async () => {
    const prisma = {
      settlement: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'set_1',
          status: SettlementStatus.PENDING,
          amount: 1200,
        }),
        findFirst: jest.fn().mockResolvedValue({ id: 'set_2' }),
      },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const tenantRepository = {
      scope: () => ({
        sellerId: 'seller_demo',
        storeId: 'store_wysh',
        correlationId: 'c1',
      }),
    } as TenantRepository;

    const audit = { log: jest.fn() } as unknown as AuditService;
    const queue = {
      enqueueReconciliation: jest.fn(),
    } as unknown as QueueService;

    const service = new SettlementService(
      prisma,
      tenantRepository,
      audit,
      queue,
    );

    await expect(
      service.updateStatus('set_1', {
        status: SettlementStatus.PROCESSING,
        payoutIdempotencyKey: 'dup-payout-key',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
