import { AnalyticsEventType, WebhookEventType } from '@prisma/client';

export interface ReconciliationJobPayload {
  sellerId: string;
  storeId: string;
  runKey: string;
  correlationId: string;
  source: 'schedule' | 'settlement' | 'manual';
}

export interface WebhookDeliveryJobPayload {
  deliveryId: string;
  correlationId: string;
}

export interface WebhookDeadLetterPayload {
  deliveryId: string;
  correlationId: string;
  reason: string;
}

export interface AnalyticsIngestionItem {
  sellerId: string;
  storeId: string;
  eventType: AnalyticsEventType;
  idempotencyKey: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsIngestionJobPayload {
  events: AnalyticsIngestionItem[];
}

export interface MediaProcessingJobPayload {
  mediaJobId: string;
  correlationId: string;
}

export interface EmitWebhookEventPayload {
  sellerId: string;
  storeId: string;
  eventType: WebhookEventType;
  eventKey: string;
  entityId: string;
  correlationId: string;
  payload: Record<string, unknown>;
}
