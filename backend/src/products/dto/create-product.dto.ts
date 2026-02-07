import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariationOptionDto {
  @IsString()
  label: string;

  @IsNumber()
  @IsOptional()
  price_modifier?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock_quantity?: number;

  @IsNumber()
  @IsOptional()
  display_order?: number;
}

export class CreateProductVariationDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  display_order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationOptionDto)
  options: CreateProductVariationOptionDto[];
}

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  base_price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discount_price?: number;

  @IsNumber()
  @Min(0)
  stock_quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  points_value?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationDto)
  @IsOptional()
  variations?: CreateProductVariationDto[];
}
