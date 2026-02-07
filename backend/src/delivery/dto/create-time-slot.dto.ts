import { IsString, IsBoolean, IsOptional, IsInt, Min, Matches } from 'class-validator';

export class CreateTimeSlotDto {
  @IsString()
  label: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in format HH:MM or HH:MM:SS',
  })
  start_time: string; // Format: "HH:MM:SS" or "HH:MM"

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in format HH:MM or HH:MM:SS',
  })
  end_time: string; // Format: "HH:MM:SS" or "HH:MM"

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  display_order?: number;
}
