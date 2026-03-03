import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

const UNITS = ['unit', 'kg', 'g', 'm', 'cm', 'L', 'ml'] as const;

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  name_ar?: string;

  @IsString()
  @IsIn([...UNITS])
  @IsOptional()
  unit?: (typeof UNITS)[number];

  @IsNumber()
  @IsOptional()
  stock_quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  low_stock_threshold?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
