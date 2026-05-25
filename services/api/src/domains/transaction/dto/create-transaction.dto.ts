import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty()
  @IsInt()
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  idempotencyKey!: string;
}
