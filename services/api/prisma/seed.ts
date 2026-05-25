import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  const seller = await prisma.seller.upsert({
    where: { slug: 'wysh' },
    update: { name: 'Wysh Demo Seller', deletedAt: null },
    create: { name: 'Wysh Demo Seller', slug: 'wysh' },
  });

  const store = await prisma.store.upsert({
    where: { sellerId_slug: { sellerId: seller.id, slug: 'store-wysh' } },
    update: { name: 'Wysh Main Store', deletedAt: null },
    create: {
      sellerId: seller.id,
      name: 'Wysh Main Store',
      slug: 'store-wysh',
      currency: 'INR',
    },
  });

  const passwordHash = await bcrypt.hash('Password@123', 10);

  await prisma.user.upsert({
    where: {
      sellerId_storeId_email: {
        sellerId: seller.id,
        storeId: store.id,
        email: 'owner@wysh.test',
      },
    },
    update: {
      role: Role.OWNER,
      permissions: [
        'catalog:read',
        'catalog:write',
        'orders:read',
        'orders:manage',
        'shipments:manage',
        'finance:read',
        'finance:write',
        'users:manage',
        'admin:read',
      ],
      passwordHash,
      deletedAt: null,
    },
    create: {
      sellerId: seller.id,
      storeId: store.id,
      email: 'owner@wysh.test',
      passwordHash,
      role: Role.OWNER,
      permissions: [
        'catalog:read',
        'catalog:write',
        'orders:read',
        'orders:manage',
        'shipments:manage',
        'finance:read',
        'finance:write',
        'users:manage',
        'admin:read',
      ],
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
