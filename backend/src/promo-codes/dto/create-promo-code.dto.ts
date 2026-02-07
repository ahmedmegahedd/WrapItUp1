import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsIn, Min } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discount_type: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  discount_value: number;

  @IsDateString()
  @IsOptional()
  expires_at?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  max_usage_count?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
