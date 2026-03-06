import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class UpdateCollaboratorDto {
  @IsString()
  @IsOptional()
  brand_name?: string;

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission_rate?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
