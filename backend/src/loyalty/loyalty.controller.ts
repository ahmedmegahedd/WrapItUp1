import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /** Get points balance by customer email (e.g. from checkout or account). */
  @Get('balance')
  getBalance(@Query('email') email: string) {
    if (!email || typeof email !== 'string') {
      return { points_balance: 0 };
    }
    return this.loyaltyService.getBalanceByEmail(email.trim());
  }

  /** List active rewards for app/website. */
  @Get('rewards')
  getRewards() {
    return this.loyaltyService.findAllRewards(true);
  }

  /** Redeem a reward (phase-ready). Validates balance and reward, deducts points. */
  @Post('redeem')
  redeem(@Body() dto: RedeemRewardDto) {
    return this.loyaltyService.redeemReward(dto.email, dto.reward_id);
  }
}
