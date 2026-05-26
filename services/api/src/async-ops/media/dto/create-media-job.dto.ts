import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMediaJobDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  sourceObjectKey!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  destinationPrefix!: string;
}
