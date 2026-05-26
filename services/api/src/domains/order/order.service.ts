import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  NEW: [OrderStatus.CONFIRMED],
  CONFIRMED: [OrderStatus.PACKED],
  PACKED: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.order.findMany({
      where: {
        sellerId,
        storeId,
        deletedAt: null,
        ...(query.search
          ? { orderNumber: { contains: query.search, mode: 'insensitive' } }
          : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(payload: CreateOrderDto) {
    const scope = this.tenantRepository.scope();
    const order = await this.prisma.order.create({
      data: {
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        orderNumber: payload.orderNumber,
        totalAmount: payload.totalAmount,
      },
    });

    await this.audit.log({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      userId: scope.userId,
      entityType: 'Order',
      entityId: order.id,
      action: 'order.create',
      correlationId: scope.correlationId,
      metadata: { orderNumber: payload.orderNumber },
    });

    return order;
  }

  async updateStatus(id: string, payload: UpdateOrderStatusDto) {
    const scope = this.tenantRepository.scope();
    const order = await this.prisma.order.findFirstOrThrow({
      where: {
        id,
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        deletedAt: null,
      },
    });

    if (!validTransitions[order.status].includes(payload.status)) {
      throw new BadRequestException(
        `Invalid order transition ${order.status} -> ${payload.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const update = await tx.order.updateMany({
        where: {
          id: order.id,
          sellerId: scope.sellerId,
          storeId: scope.storeId,
          deletedAt: null,
          status: order.status,
          version: order.version,
        },
        data: { status: payload.status, version: { increment: 1 } },
      });

      if (update.count !== 1) {
        throw new ConflictException(
          'Order was updated concurrently. Please retry the request.',
        );
      }

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      await this.audit.log(
        {
          sellerId: scope.sellerId,
          storeId: scope.storeId,
          userId: scope.userId,
          entityType: 'Order',
          entityId: updated.id,
          action: 'order.status.update',
          correlationId: scope.correlationId,
          metadata: { from: order.status, to: payload.status },
        },
        tx,
      );

      return updated;
    });
  }
}
