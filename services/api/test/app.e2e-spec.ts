import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Wysh Sellers Hub API (e2e)', () => {
  let app: INestApplication;
  let server: App;

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
    await app.init();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health and slug readiness information', async () => {
    await request(server).get('/api/v1/health/liveness').expect(200).expect({
      status: 'ok',
      service: 'wysh-sellers-api',
    });

    await request(server)
      .get('/api/v1/onboarding/slug-availability')
      .query({ slug: 'wysh' })
      .expect(200)
      .expect({ slug: 'wysh', available: false });
  });

  it('issues tenant-bound tokens and blocks cross-tenant header overrides', async () => {
    const loginResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@wysh.test', password: 'Password@123' })
      .expect(201);

    const token = (loginResponse.body as { accessToken: string }).accessToken;

    await request(server)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(
          (response.body as { tenant: { sellerId: string; storeId: string } })
            .tenant,
        ).toEqual({
          sellerId: 'seller_demo',
          storeId: 'store_wysh',
        });
      });

    await request(server)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .set('x-seller-id', 'another-seller')
      .set('x-store-id', 'another-store')
      .expect(403);
  });
});
