import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

const UNITS = ['unit', 'kg', 'g', 'm', 'cm', 'L', 'ml'] as const;

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  name_ar?: string;

  @IsString()
  @IsIn([...UNITS])
  unit: (typeof UNITS)[number];

  @IsNumber()
  @Min(0)
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
