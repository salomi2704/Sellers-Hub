import { ConflictException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { TenantRepository } from '../../common/tenant-repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  it('maps unique idempotency errors to conflict responses', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '6.x',
        }),
      ),
    } as unknown as PrismaService;

    const tenantRepository = {
      scope: () => ({
        sellerId: 'seller_demo',
        storeId: 'store_wysh',
        correlationId: 'c1',
      }),
    } as TenantRepository;

    const audit = { log: jest.fn() } as unknown as AuditService;
    const service = new TransactionService(prisma, tenantRepository, audit);

    await expect(
      service.create({
        amount: 100,
        idempotencyKey: 'dup-key',
        type: TransactionType.ORDER_CAPTURE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
