import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();

    return this.prisma.auditLog.findMany({
      where: {
        sellerId,
        storeId,
        ...(query.search
          ? {
              OR: [
                { entityType: { contains: query.search, mode: 'insensitive' } },
                { action: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }
}
