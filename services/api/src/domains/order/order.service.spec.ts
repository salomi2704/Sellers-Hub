import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { OrderService } from './order.service';

describe('OrderService', () => {
  it('rejects invalid state transitions', async () => {
    const prisma = {
      order: {
        findFirstOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'o1', status: OrderStatus.NEW }),
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

    const service = new OrderService(prisma, tenantRepository, audit);

    await expect(
      service.updateStatus('o1', { status: OrderStatus.SHIPPED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
