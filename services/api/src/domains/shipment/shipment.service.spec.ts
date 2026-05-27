import { BadRequestException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { WebhookService } from '../../async-ops/webhook/webhook.service';
import { TenantRepository } from '../../common/tenant-repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ShipmentService } from './shipment.service';

describe('ShipmentService', () => {
  it('rejects invalid state transitions', async () => {
    const prisma = {
      shipment: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'sh_1',
          status: ShipmentStatus.CREATED,
          timeline: [],
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
    const service = new ShipmentService(
      prisma,
      tenantRepository,
      audit,
      webhook,
    );

    await expect(
      service.updateStatus('sh_1', { status: ShipmentStatus.DELIVERED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
