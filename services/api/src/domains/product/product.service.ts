import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { AuditService } from '../../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.product.findMany({
      where: {
        sellerId,
        storeId,
        deletedAt: null,
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(payload: CreateProductDto) {
    const scope = this.tenantRepository.scope();

    const product = await this.prisma.product.create({
      data: {
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        name: payload.name,
        description: payload.description,
      },
    });

    await this.audit.log({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      userId: scope.userId,
      correlationId: scope.correlationId,
      entityType: 'Product',
      entityId: product.id,
      action: 'product.create',
      metadata: { name: payload.name },
    });

    return product;
  }
}
