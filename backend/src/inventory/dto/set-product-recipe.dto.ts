import { IsArray, ValidateNested, Min, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeMaterialItemDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class SetProductRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeMaterialItemDto)
  materials: RecipeMaterialItemDto[];
}
