import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(
    pinoHttp({
      level: process.env.LOG_LEVEL ?? 'info',
      genReqId: (req, res) => {
        const header = req.headers['x-correlation-id'];
        const correlationId =
          (Array.isArray(header) ? header[0] : header) ?? randomUUID();
        res.setHeader('x-correlation-id', correlationId);
        return correlationId;
      },
      customProps: (req) => ({
        sellerId: req.headers['x-seller-id'],
        storeId: req.headers['x-store-id'],
      }),
    }),
  );

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN });
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

  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
