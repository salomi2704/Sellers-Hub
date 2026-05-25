import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  list(query: PaginationQueryDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();
    return this.prisma.user.findMany({
      where: {
        sellerId,
        storeId,
        deletedAt: null,
        ...(query.search
          ? { email: { contains: query.search, mode: 'insensitive' } }
          : {}),
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });
  }

  async create(payload: CreateUserDto) {
    const { sellerId, storeId } = this.tenantRepository.scope();
    const passwordHash = await bcrypt.hash(payload.password, 10);

    return this.prisma.user.create({
      data: {
        sellerId,
        storeId,
        email: payload.email,
        passwordHash,
        role: payload.role,
        permissions: payload.permissions,
      },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });
  }
}
