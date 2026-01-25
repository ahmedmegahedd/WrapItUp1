import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'preparing', 'out_for_delivery', 'delivered'])
  order_status: string;
}
