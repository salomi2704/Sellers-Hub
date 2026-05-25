import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateSkuDto } from './dto/create-sku.dto';

@Injectable()
export class SkuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.sku.findMany({
      where: {
        sellerId,
        storeId,
        deletedAt: null,
        ...(query.search
          ? { code: { contains: query.search, mode: 'insensitive' } }
          : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(payload: CreateSkuDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.sku.create({
      data: {
        sellerId,
        storeId,
        productId: payload.productId,
        code: payload.code,
        price: payload.price,
        inventory: payload.inventory,
      },
    });
  }
}
