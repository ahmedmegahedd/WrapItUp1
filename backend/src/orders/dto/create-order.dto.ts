import { IsString, IsEmail, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsArray()
  @IsOptional()
  selected_variations?: Record<string, string>; // { variationName: optionId }

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selected_addons?: string[]; // Array of addon IDs
}

export class CreateOrderDto {
  @IsString()
  customer_name: string;

  @IsEmail()
  customer_email: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsDateString()
  delivery_date: string;

  @IsString()
  delivery_time_slot: string;

  @IsString()
  @IsOptional()
  card_message?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
