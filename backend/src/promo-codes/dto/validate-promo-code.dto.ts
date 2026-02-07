import { IsString, IsNumber, Min } from 'class-validator';

export class ValidatePromoCodeDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  subtotal_egp: number;
}
