import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { WebhookService } from '../../async-ops/webhook/webhook.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { OrderService } from './order.service';

describe('OrderService', () => {
  it('rejects invalid state transitions', async () => {
    const prisma = {
      order: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'o1',
          status: OrderStatus.NEW,
          version: 1,
        }),
      },
    } as unknown as PrismaService;

    const tenantRepository = {
      scope: () => ({
        sellerId: 'seller_demo',
        storeId: 'store_wysh',
        correlationId: 'c1',
      }),
    } as TenantRepository;

    const audit = { log: jest.fn() } as unknown as AuditService;

    const webhook = { emitEvent: jest.fn() } as unknown as WebhookService;
    const service = new OrderService(prisma, tenantRepository, audit, webhook);

    await expect(
      service.updateStatus('o1', { status: OrderStatus.SHIPPED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects concurrent status updates', async () => {
    const prisma = {
      order: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'o1',
          status: OrderStatus.NEW,
          version: 1,
        }),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          async (
            fn: (tx: {
              order: { updateMany: () => Promise<{ count: number }> };
            }) => Promise<unknown>,
          ) =>
            fn({
              order: {
                updateMany: () => Promise.resolve({ count: 0 }),
              },
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
    const webhook = { emitEvent: jest.fn() } as unknown as WebhookService;
    const service = new OrderService(prisma, tenantRepository, audit, webhook);

    await expect(
      service.updateStatus('o1', { status: OrderStatus.CONFIRMED }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
