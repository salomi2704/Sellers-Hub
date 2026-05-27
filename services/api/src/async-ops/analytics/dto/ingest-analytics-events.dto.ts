import { ApiProperty } from '@nestjs/swagger';
import { AnalyticsEventType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnalyticsItemDto {
  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  idempotencyKey!: string;

  @ApiProperty({ required: false, type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class IngestAnalyticsEventsDto {
  @ApiProperty({ type: [AnalyticsItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsItemDto)
  events!: AnalyticsItemDto[];
}
