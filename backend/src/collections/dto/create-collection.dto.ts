import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  show_on_homepage?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  product_ids?: string[];
}
