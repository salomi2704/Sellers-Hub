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
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.FRONTEND_ORIGIN = 'http://localhost:4173';
    process.env.JWT_SECRET = 'local-secret-local-secret-local-secret';
    process.env.DATABASE_URL = 'postgresql://wysh:wysh@localhost:5432/wysh?schema=public';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.MINIO_ENDPOINT = 'localhost';
    process.env.MINIO_PORT = '9000';
    process.env.MINIO_USE_SSL = 'false';
    process.env.MINIO_ACCESS_KEY = 'minio';
    process.env.MINIO_SECRET_KEY = 'minio123';
    process.env.MINIO_BUCKET = 'sellers-hub';

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

  it('returns liveness payload', async () => {
    await request(server).get('/api/v1/health/liveness').expect(200).expect({
      status: 'ok',
      service: 'wysh-sellers-api',
    });
  });

  it('requires authentication for tenant-protected endpoints', async () => {
    await request(server).get('/api/v1/orders').expect(401);
  });
});
