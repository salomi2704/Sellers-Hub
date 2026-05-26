import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import { Readable } from 'node:stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private client?: Client;
  private bucket = process.env.MINIO_BUCKET ?? 'sellers-hub';

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
    if (!this.client) {
      return 'ok';
    }
    await this.client.bucketExists(this.bucket);
    return 'ok';
  }

  async uploadObject(
    objectKey: string,
    payload: Buffer,
    contentType: string,
  ): Promise<void> {
    const client = this.ensureClient();
    await client.putObject(this.bucket, objectKey, payload, payload.byteLength, {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    });
  }

  async downloadObject(objectKey: string): Promise<Buffer> {
    const client = this.ensureClient();
    const stream = await client.getObject(this.bucket, objectKey);
    return this.readAll(stream);
  }

  async uploadStream(
    objectKey: string,
    stream: Readable,
    size: number,
    contentType: string,
  ): Promise<void> {
    const client = this.ensureClient();
    await client.putObject(this.bucket, objectKey, stream, size, {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    });
  }

  async createSignedDownloadUrl(
    objectKey: string,
    expirySeconds: number,
  ): Promise<string> {
    const client = this.ensureClient();
    return client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }

  private ensureClient(): Client {
    if (!this.client) {
      throw new Error('MinIO client is not initialized.');
    }
    return this.client;
  }

  private async readAll(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
