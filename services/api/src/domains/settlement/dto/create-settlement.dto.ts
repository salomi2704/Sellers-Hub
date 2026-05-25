import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSettlementDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}
