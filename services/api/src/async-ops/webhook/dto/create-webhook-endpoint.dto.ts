import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export const webhookEventNames = [
  'order.created',
  'order.updated',
  'shipment.updated',
  'settlement.completed',
  'payout.failed',
] as const;

export type WebhookEventName = (typeof webhookEventNames)[number];

export class CreateWebhookEndpointDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ enum: webhookEventNames, isArray: true })
  @IsArray()
  @IsIn(webhookEventNames, { each: true })
  events!: WebhookEventName[];

  @ApiProperty({ required: false, minLength: 12 })
  @IsOptional()
  @IsString()
  @MinLength(12)
  secret?: string;
}
