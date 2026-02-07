import { IsEmail, IsUUID } from 'class-validator';

export class RedeemRewardDto {
  @IsEmail()
  email: string;

  @IsUUID()
  reward_id: string;
}
