import { WebhookEventType } from '@prisma/client';
import { WebhookEventName } from './dto/create-webhook-endpoint.dto';

export const webhookEventTypeToName: Record<
  WebhookEventType,
  WebhookEventName
> = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  SHIPMENT_UPDATED: 'shipment.updated',
  SETTLEMENT_COMPLETED: 'settlement.completed',
  PAYOUT_FAILED: 'payout.failed',
};

export const webhookEventNameToType: Record<
  WebhookEventName,
  WebhookEventType
> = {
  'order.created': WebhookEventType.ORDER_CREATED,
  'order.updated': WebhookEventType.ORDER_UPDATED,
  'shipment.updated': WebhookEventType.SHIPMENT_UPDATED,
  'settlement.completed': WebhookEventType.SETTLEMENT_COMPLETED,
  'payout.failed': WebhookEventType.PAYOUT_FAILED,
};
