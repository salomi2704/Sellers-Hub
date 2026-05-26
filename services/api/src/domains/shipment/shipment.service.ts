import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ShipmentStatus, WebhookEventType } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { WebhookService } from '../../async-ops/webhook/webhook.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

const shipmentTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: [ShipmentStatus.READY_FOR_PICKUP, ShipmentStatus.EXCEPTION],
  READY_FOR_PICKUP: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.EXCEPTION],
  IN_TRANSIT: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.EXCEPTION],
  OUT_FOR_DELIVERY: [ShipmentStatus.DELIVERED, ShipmentStatus.EXCEPTION],
  DELIVERED: [],
  EXCEPTION: [ShipmentStatus.READY_FOR_PICKUP, ShipmentStatus.IN_TRANSIT],
};

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
    private readonly webhookService: WebhookService,
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

    if (!shipmentTransitions[shipment.status].includes(payload.status)) {
      throw new BadRequestException(
        `Invalid shipment transition ${shipment.status} -> ${payload.status}`,
      );
    }

    const timeline = Array.isArray(shipment.timeline) ? shipment.timeline : [];

    const timelineEntry = {
      status: payload.status,
      at: new Date().toISOString(),
    };
    const update = await this.prisma.shipment.updateMany({
      where: {
        id: shipment.id,
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        status: shipment.status,
      },
      data: {
        status: payload.status,
        timeline: [...(timeline as object[]), timelineEntry],
      },
    });

    if (update.count !== 1) {
      throw new ConflictException(
        'Shipment was updated concurrently. Please retry the request.',
      );
    }

    const updated = await this.prisma.shipment.findUniqueOrThrow({
      where: { id: shipment.id },
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

    await this.webhookService.emitEvent({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      eventType: WebhookEventType.SHIPMENT_UPDATED,
      eventKey: `shipment.updated:${updated.id}:${updated.status}`,
      entityId: updated.id,
      correlationId: scope.correlationId,
      payload: {
        shipmentId: updated.id,
        orderId: updated.orderId,
        status: updated.status,
      },
    });

    return updated;
  }
}
