import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDeliveryDayDto } from './create-delivery-day.dto';

export class BulkUpdateDeliveryDaysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryDayDto)
  days: CreateDeliveryDayDto[];
}
