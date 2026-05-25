import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  me() {
    const { storeId } = this.tenantRepository.scope();
    return this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  }
}
