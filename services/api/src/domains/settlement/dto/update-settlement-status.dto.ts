import { ApiProperty } from '@nestjs/swagger';
import { SettlementStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSettlementStatusDto {
  @ApiProperty({ enum: SettlementStatus })
  @IsEnum(SettlementStatus)
  status!: SettlementStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payoutIdempotencyKey?: string;
}
