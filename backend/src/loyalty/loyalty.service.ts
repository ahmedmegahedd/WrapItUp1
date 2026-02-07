import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class LoyaltyService {
  constructor(private supabaseService: SupabaseService) {}

  /** Get or create loyalty account by email. */
  async getOrCreateAccountByEmail(email: string): Promise<{ id: string; email: string; points_balance: number }> {
    const supabase = this.supabaseService.getAdminClient();
    const normalized = email.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('loyalty_accounts')
      .select('id, email, points_balance')
      .eq('email', normalized)
      .single();

    if (existing) return existing;

    const { data: created, error } = await supabase
      .from('loyalty_accounts')
      .insert({ email: normalized, points_balance: 0 })
      .select('id, email, points_balance')
      .single();

    if (error) throw new BadRequestException(error.message);
    return created;
  }

  /** Get points balance by email (for app). */
  async getBalanceByEmail(email: string): Promise<{ points_balance: number }> {
    const account = await this.getOrCreateAccountByEmail(email);
    return { points_balance: account.points_balance };
  }

  /** Add points (earn). Ensures balance never goes negative. */
  async addPoints(
    loyaltyAccountId: string,
    points: number,
    options: { relatedOrderId?: string; relatedRewardId?: string } = {},
  ): Promise<void> {
    if (points <= 0) return;
    const supabase = this.supabaseService.getAdminClient();

    const { data: account, error: fetchErr } = await supabase
      .from('loyalty_accounts')
      .select('points_balance')
      .eq('id', loyaltyAccountId)
      .single();

    if (fetchErr || !account) throw new NotFoundException('Loyalty account not found');

    const newBalance = (account.points_balance ?? 0) + points;

    const { error: updateErr } = await supabase
      .from('loyalty_accounts')
      .update({ points_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', loyaltyAccountId);

    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.createTransaction(loyaltyAccountId, 'earn', points, options);
  }

  /** Deduct points (redeem). Fails if insufficient balance. */
  async deductPoints(
    loyaltyAccountId: string,
    points: number,
    options: { relatedOrderId?: string; relatedRewardId?: string } = {},
  ): Promise<void> {
    if (points <= 0) throw new BadRequestException('Points must be positive');
    const supabase = this.supabaseService.getAdminClient();

    const { data: account, error: fetchErr } = await supabase
      .from('loyalty_accounts')
      .select('points_balance')
      .eq('id', loyaltyAccountId)
      .single();

    if (fetchErr || !account) throw new NotFoundException('Loyalty account not found');

    const current = account.points_balance ?? 0;
    if (current < points) {
      throw new BadRequestException('Insufficient points balance');
    }

    const newBalance = current - points;

    const { error: updateErr } = await supabase
      .from('loyalty_accounts')
      .update({ points_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', loyaltyAccountId);

    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.createTransaction(loyaltyAccountId, 'redeem', -Math.abs(points), options);
  }

  private async createTransaction(
    loyaltyAccountId: string,
    type: 'earn' | 'redeem' | 'adjustment',
    points: number,
    options: { relatedOrderId?: string; relatedRewardId?: string } = {},
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('points_transactions').insert({
      loyalty_account_id: loyaltyAccountId,
      type,
      points,
      related_order_id: options.relatedOrderId ?? null,
      related_reward_id: options.relatedRewardId ?? null,
    });
  }

  /** Grant points for a paid order. Called from OrdersService.onPaymentSuccess. */
  async grantPointsForOrder(orderId: string, customerEmail: string, pointsEarned: number): Promise<void> {
    if (pointsEarned <= 0) return;
    const account = await this.getOrCreateAccountByEmail(customerEmail);
    await this.addPoints(account.id, pointsEarned, { relatedOrderId: orderId });
  }

  /** Rewards CRUD */
  async createReward(dto: CreateRewardDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        points_required: dto.points_required,
        image_url: dto.image_url ?? null,
        is_active: dto.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateReward(id: string, dto: UpdateRewardDto) {
    const supabase = this.supabaseService.getAdminClient();
    await this.getRewardById(id);
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.points_required !== undefined) updateData.points_required = dto.points_required;
    if (dto.image_url !== undefined) updateData.image_url = dto.image_url;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    const { data, error } = await supabase.from('rewards').update(updateData).eq('id', id).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getRewardById(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('rewards').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Reward not found');
    return data;
  }

  async findAllRewards(activeOnly = false) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('rewards').select('*').order('points_required', { ascending: true });
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async deleteReward(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    await this.getRewardById(id);
    const { error } = await supabase.from('rewards').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Reward deleted' };
  }

  /** Redeem a reward for an email. Validates balance and reward active. */
  async redeemReward(email: string, rewardId: string): Promise<{ points_balance: number }> {
    const reward = await this.getRewardById(rewardId);
    if (!reward.is_active) throw new BadRequestException('Reward is not available');
    const pointsRequired = reward.points_required;
    const account = await this.getOrCreateAccountByEmail(email);
    await this.deductPoints(account.id, pointsRequired, { relatedRewardId: rewardId });
    const updated = await this.getOrCreateAccountByEmail(email);
    return { points_balance: updated.points_balance };
  }
}
