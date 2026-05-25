import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  orderNumber!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  totalAmount!: number;
}
