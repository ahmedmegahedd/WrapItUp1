import { IsDateString, IsString, IsOptional, IsInt, Min } from 'class-validator';

export enum DeliveryDayStatus {
  AVAILABLE = 'available',
  FULLY_BOOKED = 'fully_booked',
  UNAVAILABLE = 'unavailable',
}

export class CreateDeliveryDayDto {
  @IsDateString()
  date: string;

  @IsString()
  status: DeliveryDayStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  admin_note?: string;
}
