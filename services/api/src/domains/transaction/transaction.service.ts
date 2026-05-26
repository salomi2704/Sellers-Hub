import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();
    return this.prisma.transaction.findMany({
      where: { sellerId, storeId },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(payload: CreateTransactionDto) {
    const scope = this.tenantRepository.scope();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const entry = await tx.transaction.create({
          data: {
            sellerId: scope.sellerId,
            storeId: scope.storeId,
            orderId: payload.orderId,
            type: payload.type,
            amount: payload.amount,
            idempotencyKey: payload.idempotencyKey,
          },
        });

        await this.audit.log(
          {
            sellerId: scope.sellerId,
            storeId: scope.storeId,
            userId: scope.userId,
            entityType: 'Transaction',
            entityId: entry.id,
            action: 'transaction.create',
            correlationId: scope.correlationId,
            metadata: { type: payload.type, amount: payload.amount },
          },
          tx,
        );

        return entry;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Duplicate idempotency key.');
      }
      throw error;
    }
  }
}
