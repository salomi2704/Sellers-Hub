import { IsIn, IsOptional, IsString } from 'class-validator';

export class AnalyticsEventDto {
  @IsIn([
    'product_view',
    'add_to_cart',
    'affiliate_click',
    'redirect',
    'search',
  ])
  eventType!:
    | 'product_view'
    | 'add_to_cart'
    | 'affiliate_click'
    | 'redirect'
    | 'search';

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
