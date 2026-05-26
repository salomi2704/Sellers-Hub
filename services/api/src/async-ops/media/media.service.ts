import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaJobStatus } from '@prisma/client';
import sharp from 'sharp';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MediaProcessingJobPayload } from '../../infrastructure/queue/queue.jobs';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { MinioService } from '../../infrastructure/storage/minio.service';

interface EnqueueMediaParams {
  sellerId: string;
  storeId: string;
  sourceObjectKey: string;
  destinationPrefix: string;
  correlationId: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly minio: MinioService,
  ) {}

  async enqueueProcess(params: EnqueueMediaParams) {
    const job = await this.prisma.mediaJob.create({
      data: {
        sellerId: params.sellerId,
        storeId: params.storeId,
        sourceObjectKey: params.sourceObjectKey,
        destinationPrefix: params.destinationPrefix,
      },
    });

    await this.queue.enqueueMediaProcessing({
      mediaJobId: job.id,
      correlationId: params.correlationId,
    });

    return job;
  }

  async process(payload: MediaProcessingJobPayload) {
    const mediaJob = await this.prisma.mediaJob.findUnique({
      where: { id: payload.mediaJobId },
    });
    if (!mediaJob) {
      throw new NotFoundException('Media job not found.');
    }

    await this.prisma.mediaJob.update({
      where: { id: mediaJob.id },
      data: { status: MediaJobStatus.PROCESSING, attempts: { increment: 1 } },
    });

    const sourceBuffer = await this.minio.downloadObject(mediaJob.sourceObjectKey);
    const thumbnail = await sharp(sourceBuffer)
      .resize({ width: 240, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
    const compressed = await sharp(sourceBuffer).jpeg({ quality: 80 }).toBuffer();
    const optimized = await sharp(sourceBuffer).webp({ quality: 82 }).toBuffer();

    await Promise.all([
      this.minio.uploadObject(
        `${mediaJob.destinationPrefix}/thumbnail.jpg`,
        thumbnail,
        'image/jpeg',
      ),
      this.minio.uploadObject(
        `${mediaJob.destinationPrefix}/compressed.jpg`,
        compressed,
        'image/jpeg',
      ),
      this.minio.uploadObject(
        `${mediaJob.destinationPrefix}/optimized.webp`,
        optimized,
        'image/webp',
      ),
    ]);

    await this.prisma.mediaJob.update({
      where: { id: mediaJob.id },
      data: { status: MediaJobStatus.COMPLETED, error: null },
    });
  }

  async markFailed(mediaJobId: string, error: string) {
    await this.prisma.mediaJob.update({
      where: { id: mediaJobId },
      data: { status: MediaJobStatus.FAILED, error },
    });
  }
}
