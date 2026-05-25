import { IsString, MinLength } from 'class-validator';

export class SlugQueryDto {
  @IsString()
  @MinLength(3)
  slug!: string;
}
