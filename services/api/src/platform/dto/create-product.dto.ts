import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  sku!: string;

  @IsString()
  brand!: string;

  @IsIn(['ACTIVE', 'DRAFT', 'ARCHIVED'])
  status!: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

  @IsInt()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  inventory!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'DRAFT', 'ARCHIVED'])
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventory?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
