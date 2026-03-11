import { IsString, IsEmail, IsOptional, IsDateString, IsArray, IsObject, ValidateNested, IsNumber, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsObject()
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
  @IsOptional()
  delivery_time_slot?: string; // Legacy: text-based time slot

  @IsString()
  @IsOptional()
  delivery_time_slot_id?: string; // New: reference to delivery_time_slots table

  @IsString()
  @IsOptional()
  card_message?: string;

  @IsUUID()
  @IsOptional()
  delivery_destination_id?: string;

  @IsNumber()
  @IsOptional()
  delivery_fee_egp?: number;

  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  delivery_maps_link?: string;

  @IsUUID()
  @IsOptional()
  promo_code_id?: string;

  @IsNumber()
  @IsOptional()
  discount_amount_egp?: number;

  @IsString()
  @IsOptional()
  recipient_name?: string;

  @IsString()
  @IsOptional()
  recipient_phone?: string;

  /** Payment method: 'card' | 'apple_pay' | 'instapay' | 'cod'. Optional; defaults to 'card' for Paymob flow. */
  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
