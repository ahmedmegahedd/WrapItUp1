import { IsString, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class CreateCollaboratorDto {
  @IsUUID()
  adminId: string;

  @IsString()
  brand_name: string;

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
