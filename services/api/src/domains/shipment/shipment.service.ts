import { Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.shipment.findMany({
      where: {
        sellerId,
        storeId,
        ...(query.search
          ? {
              OR: [
                { awb: { contains: query.search, mode: 'insensitive' } },
                { carrier: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(payload: CreateShipmentDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();
    return this.prisma.shipment.create({
      data: {
        sellerId,
        storeId,
        orderId: payload.orderId,
        carrier: payload.carrier,
        awb: payload.awb,
        timeline: [
          { status: ShipmentStatus.CREATED, at: new Date().toISOString() },
        ],
      },
    });
  }

  async updateStatus(id: string, payload: UpdateShipmentStatusDto) {
    const scope = this.tenantRepository.scope();
    const shipment = await this.prisma.shipment.findFirstOrThrow({
      where: { id, sellerId: scope.sellerId, storeId: scope.storeId },
    });

    const timeline = Array.isArray(shipment.timeline) ? shipment.timeline : [];

    const updated = await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: payload.status,
        timeline: [
          ...(timeline as object[]),
          { status: payload.status, at: new Date().toISOString() },
        ],
      },
    });

    await this.audit.log({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      userId: scope.userId,
      entityType: 'Shipment',
      entityId: updated.id,
      action: 'shipment.status.update',
      correlationId: scope.correlationId,
      metadata: { status: payload.status },
    });

    return updated;
  }
}
