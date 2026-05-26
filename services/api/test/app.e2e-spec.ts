import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { App } from 'supertest/types';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.FRONTEND_ORIGIN = 'http://localhost:4173';
process.env.JWT_SECRET = 'local-secret-local-secret-local-secret';
process.env.DATABASE_URL =
  'postgresql://wysh:wysh@localhost:5432/wysh?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'minio';
process.env.MINIO_SECRET_KEY = 'minio123';
process.env.MINIO_BUCKET = 'sellers-hub';

import { AppModule } from './../src/app.module';

describe('Wysh Sellers Hub API (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Wysh Sellers Hub API')
      .setDescription('Production-grade multi-tenant commerce operations API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    server = app.getHttpServer() as App;
    jwtService = new JwtService({ secret: process.env.JWT_SECRET });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns liveness payload', async () => {
    await request(server).get('/api/v1/health/liveness').expect(200).expect({
      status: 'ok',
      service: 'wysh-sellers-api',
    });
  });

  it('requires authentication for tenant-protected endpoints', async () => {
    await request(server).get('/api/v1/orders').expect(403);
  });

  it('exposes prometheus metrics', async () => {
    const response = await request(server)
      .get('/api/v1/health/metrics')
      .expect(200);
    expect(response.header['content-type']).toContain('text/plain');
    expect(response.text).toContain('process_cpu_user_seconds_total');
  });

  it('exposes swagger json', async () => {
    const response = await request(server).get('/api/docs-json').expect(200);
    expect((response.body as { openapi?: string }).openapi).toBeDefined();
  });

  it('rejects cross-tenant access attempts from authenticated users', async () => {
    const token = jwtService.sign({
      sub: 'u1',
      email: 'owner@wysh.test',
      sellerId: 'seller-a',
      storeId: 'store-a',
      role: 'OWNER',
      permissions: ['orders:read'],
      type: 'access',
    });

    await request(server)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-seller-id', 'seller-b')
      .set('x-store-id', 'store-b')
      .expect(403);
  });

  it('rejects expired access tokens', async () => {
    const token = jwtService.sign(
      {
        sub: 'u1',
        email: 'owner@wysh.test',
        sellerId: 'seller-a',
        storeId: 'store-a',
        role: 'OWNER',
        permissions: ['orders:read'],
        type: 'access',
      },
      { expiresIn: '-1s' },
    );

    await request(server)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-seller-id', 'seller-a')
      .set('x-store-id', 'store-a')
      .expect(403);
  });

  it('returns forbidden for actions without required permissions', async () => {
    const token = jwtService.sign({
      sub: 'u1',
      email: 'owner@wysh.test',
      sellerId: 'seller-a',
      storeId: 'store-a',
      role: 'MANAGER',
      permissions: ['orders:read'],
      type: 'access',
    });

    await request(server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-seller-id', 'seller-a')
      .set('x-store-id', 'store-a')
      .send({ orderNumber: 'ORD-1', totalAmount: 1000 })
      .expect(403);
  });

  it('rejects invalid dto payloads', async () => {
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid-email', password: '' })
      .expect(400);
  });
});
