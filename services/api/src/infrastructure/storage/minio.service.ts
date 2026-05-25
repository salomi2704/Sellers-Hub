import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client!: Client;
  private bucket!: string;

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    this.bucket = process.env.MINIO_BUCKET ?? 'sellers-hub';
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'minio',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'minio123',
    });

    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async readinessCheck(): Promise<'ok'> {
    await this.client.bucketExists(this.bucket);
    return 'ok';
  }
}
