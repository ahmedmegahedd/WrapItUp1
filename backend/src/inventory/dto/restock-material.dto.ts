import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RestockMaterialDto {
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
