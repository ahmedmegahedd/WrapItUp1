import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, ValidateIf } from 'class-validator';
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

  /** Optional minimum order quantity. When set, must be >= 1. Omit or null = no minimum. */
  @ValidateIf((o) => o.minimum_quantity != null)
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimum_quantity?: number | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  /** When true, product appears in the app "All" collection. */
  @IsBoolean()
  @IsOptional()
  show_in_all_collection?: boolean;

  /** When true, product can appear in "People also like" at cart (admin may set up to 4). */
  @IsBoolean()
  @IsOptional()
  recommended_at_checkout?: boolean;

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
