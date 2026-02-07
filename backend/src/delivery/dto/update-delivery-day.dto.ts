import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { DeliveryDayStatus } from './create-delivery-day.dto';

export class UpdateDeliveryDayDto {
  @IsString()
  @IsOptional()
  status?: DeliveryDayStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  admin_note?: string;
}
