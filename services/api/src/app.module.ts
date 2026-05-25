import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RbacGuard } from './common/guards/rbac.guard';
import { CorrelationInterceptor } from './common/interceptors/correlation.interceptor';
import { validateEnv } from './config/env.validation';
import { AuditLogModule } from './domains/audit-log/audit-log.module';
import { OrderModule } from './domains/order/order.module';
import { ProductModule } from './domains/product/product.module';
import { SellerModule } from './domains/seller/seller.module';
import { SettlementModule } from './domains/settlement/settlement.module';
import { ShipmentModule } from './domains/shipment/shipment.module';
import { SkuModule } from './domains/sku/sku.module';
import { StoreModule } from './domains/store/store.module';
import { TransactionModule } from './domains/transaction/transaction.module';
import { UserModule } from './domains/user/user.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { MinioModule } from './infrastructure/storage/minio.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => validateEnv(config as Record<string, unknown>),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    RedisModule,
    QueueModule,
    MinioModule,
    AuditModule,
    HealthModule,
    AuthModule,
    SellerModule,
    StoreModule,
    UserModule,
    ProductModule,
    SkuModule,
    OrderModule,
    ShipmentModule,
    TransactionModule,
    SettlementModule,
    AuditLogModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
