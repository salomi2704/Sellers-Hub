import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  awb?: string;
}
