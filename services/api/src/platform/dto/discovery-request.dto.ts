import { IsIn, IsString, MinLength } from 'class-validator';

export class DiscoveryRequestDto {
  @IsIn(['keyword', 'url', 'image'])
  mode!: 'keyword' | 'url' | 'image';

  @IsString()
  @MinLength(2)
  query!: string;
}
