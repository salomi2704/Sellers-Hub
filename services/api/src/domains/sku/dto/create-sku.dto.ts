import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateSkuDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  price!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  inventory!: number;
}
