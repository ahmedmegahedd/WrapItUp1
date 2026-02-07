import { IsString, IsBoolean, IsOptional, IsInt, Min, Matches } from 'class-validator';

export class UpdateTimeSlotDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in format HH:MM or HH:MM:SS',
  })
  @IsOptional()
  start_time?: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in format HH:MM or HH:MM:SS',
  })
  @IsOptional()
  end_time?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  display_order?: number;
}
