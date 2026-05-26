import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WebhookDeliveryStatus, WebhookEventType } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import { AuditService } from '../../audit/audit.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { EmitWebhookEventPayload } from '../../infrastructure/queue/queue.jobs';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { webhookEventNameToType, webhookEventTypeToName } from './webhook-events.mapper';

interface TenantScope {
  sellerId: string;
  storeId: string;
  userId?: string;
  correlationId: string;
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
  ) {}

  async createEndpoint(scope: TenantScope, payload: CreateWebhookEndpointDto) {
    const secret = payload.secret ?? randomUUID().replace(/-/g, '');
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        sellerId: scope.sellerId,
        storeId: scope.storeId,
        url: payload.url,
        secret,
        events: payload.events.map((event) => webhookEventNameToType[event]),
      },
    });

    await this.audit.log({
      sellerId: scope.sellerId,
      storeId: scope.storeId,
      userId: scope.userId,
      entityType: 'WebhookEndpoint',
      entityId: endpoint.id,
      action: 'webhook.endpoint.create',
      correlationId: scope.correlationId,
      metadata: { events: payload.events, url: payload.url },
    });

    return {
      ...endpoint,
      events: endpoint.events.map((event) => webhookEventTypeToName[event]),
      secret,
    };
  }

  async listEndpoints(scope: TenantScope) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        sellerId: scope.sellerId,
        storeId: scope.storeId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return endpoints.map((endpoint) => ({
      ...endpoint,
      secret: undefined,
      events: endpoint.events.map((event) => webhookEventTypeToName[event]),
    }));
  }

  async updateEndpointStatus(
    scope: TenantScope,
    endpointId: string,
    isActive: boolean,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        sellerId: scope.sellerId,
        storeId: scope.storeId,
      },
    });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found.');
    }

    return this.prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { isActive },
    });
  }

  async replayEvent(scope: TenantScope, eventId: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: {
        id: eventId,
        sellerId: scope.sellerId,
        storeId: scope.storeId,
      },
      include: { deliveries: true },
    });
    if (!event) {
      throw new NotFoundException('Webhook event not found.');
    }

    const replayable = event.deliveries.filter(
      (delivery) => delivery.status !== WebhookDeliveryStatus.DELIVERED,
    );

    await Promise.all(
      replayable.map(async (delivery) => {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: WebhookDeliveryStatus.PENDING, error: null },
        });
        await this.queue.enqueueWebhookDelivery({
          deliveryId: delivery.id,
          correlationId: scope.correlationId,
        });
      }),
    );

    return { eventId: event.id, queued: replayable.length };
  }

  async emitEvent(payload: EmitWebhookEventPayload) {
    const event = await this.prisma.webhookEvent.upsert({
      where: {
        sellerId_storeId_eventKey: {
          sellerId: payload.sellerId,
          storeId: payload.storeId,
          eventKey: payload.eventKey,
        },
      },
      update: {},
      create: {
        sellerId: payload.sellerId,
        storeId: payload.storeId,
        eventType: payload.eventType,
        eventKey: payload.eventKey,
        correlationId: payload.correlationId,
        entityId: payload.entityId,
        payload: payload.payload as Prisma.InputJsonValue,
      },
    });

    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        sellerId: payload.sellerId,
        storeId: payload.storeId,
        isActive: true,
        events: { has: payload.eventType },
      },
      select: { id: true },
    });

    await Promise.all(
      endpoints.map(async (endpoint) => {
        const idempotencyKey = createHmac('sha256', payload.eventKey)
          .update(`${event.id}:${endpoint.id}`)
          .digest('hex');

        const delivery = await this.prisma.webhookDelivery.upsert({
          where: { eventId_endpointId: { eventId: event.id, endpointId: endpoint.id } },
          update: {},
          create: {
            eventId: event.id,
            endpointId: endpoint.id,
            idempotencyKey,
          },
        });

        await this.queue.enqueueWebhookDelivery({
          deliveryId: delivery.id,
          correlationId: payload.correlationId,
        });
      }),
    );

    return event;
  }

  async processDelivery(deliveryId: string, correlationId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true, event: true },
    });
    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found.');
    }
    if (delivery.status === WebhookDeliveryStatus.DELIVERED) {
      return;
    }

    const requestBody = JSON.stringify({
      id: delivery.event.id,
      eventType: webhookEventTypeToName[delivery.event.eventType],
      createdAt: delivery.event.createdAt.toISOString(),
      payload: delivery.event.payload,
    });
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', delivery.endpoint.secret)
      .update(`${timestamp}.${requestBody}`)
      .digest('hex');

    const attemptNumber = delivery.attempts + 1;
    const response = await fetch(delivery.endpoint.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': correlationId,
        'x-webhook-id': delivery.event.id,
        'x-webhook-attempt': String(attemptNumber),
        'x-webhook-timestamp': timestamp,
        'x-webhook-signature': signature,
      },
      body: requestBody,
    });

    if (!response.ok) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          attempts: attemptNumber,
          responseStatus: response.status,
          lastAttemptAt: new Date(),
          error: `HTTP ${response.status}`,
        },
      });
      throw new ConflictException(`Webhook delivery failed with status ${response.status}`);
    }

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: WebhookDeliveryStatus.DELIVERED,
        attempts: attemptNumber,
        responseStatus: response.status,
        lastAttemptAt: new Date(),
        error: null,
      },
    });
  }

  async markDeadLetter(deliveryId: string, reason: string) {
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: WebhookDeliveryStatus.DEAD_LETTER,
        error: reason,
        lastAttemptAt: new Date(),
      },
    });
  }

  mapEventNameToType(eventName: keyof typeof webhookEventNameToType): WebhookEventType {
    return webhookEventNameToType[eventName];
  }
}
