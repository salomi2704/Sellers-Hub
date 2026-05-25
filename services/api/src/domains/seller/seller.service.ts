import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantRepository } from '../../common/tenant-repository';

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  me() {
    const { sellerId } = this.tenantRepository.scope();
    return this.prisma.seller.findUniqueOrThrow({ where: { id: sellerId } });
  }
}
