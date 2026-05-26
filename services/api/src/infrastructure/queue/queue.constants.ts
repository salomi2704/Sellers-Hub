export const QUEUE_NAMES = {
  RECONCILIATION: 'reconciliation',
  WEBHOOK_DELIVERY: 'webhook-delivery',
  WEBHOOK_DEAD_LETTER: 'webhook-dead-letter',
  ANALYTICS_INGESTION: 'analytics-ingestion',
  MEDIA_PROCESSING: 'media-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
