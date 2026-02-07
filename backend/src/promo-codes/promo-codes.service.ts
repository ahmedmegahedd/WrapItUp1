import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(includeInactive = false) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('promo_codes').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Promo code not found');
    return data;
  }

  async findByCode(code: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();
    if (error || !data) return null;
    return data;
  }

  /** Validate promo and return discount amount in EGP and promo_code_id. Throws if invalid. */
  async validateAndGetDiscount(
    code: string,
    subtotalEgp: number,
  ): Promise<{ discount_amount_egp: number; promo_code_id: string }> {
    const promo = await this.findByCode(code);
    if (!promo) throw new BadRequestException('Invalid or expired promo code');
    if (!promo.is_active) throw new BadRequestException('This promo code is no longer active');
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new BadRequestException('This promo code has expired');
    }
    if (promo.max_usage_count != null && (promo.current_usage_count || 0) >= promo.max_usage_count) {
      throw new BadRequestException('This promo code has reached its usage limit');
    }
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (subtotalEgp * Math.min(100, Number(promo.discount_value))) / 100;
    } else {
      discount = Math.min(Number(promo.discount_value), subtotalEgp);
    }
    return {
      discount_amount_egp: Math.round(discount * 100) / 100,
      promo_code_id: promo.id,
    };
  }

  async create(dto: CreatePromoCodeDto) {
    const supabase = this.supabaseService.getAdminClient();
    const code = dto.code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code,
        name: dto.name || null,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        expires_at: dto.expires_at || null,
        max_usage_count: dto.max_usage_count ?? null,
        is_active: dto.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(id: string, dto: UpdatePromoCodeDto) {
    const supabase = this.supabaseService.getAdminClient();
    await this.findOne(id);
    const update: Record<string, unknown> = {};
    if (dto.code !== undefined) update.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.discount_type !== undefined) update.discount_type = dto.discount_type;
    if (dto.discount_value !== undefined) update.discount_value = dto.discount_value;
    if (dto.expires_at !== undefined) update.expires_at = dto.expires_at;
    if (dto.max_usage_count !== undefined) update.max_usage_count = dto.max_usage_count;
    if (dto.is_active !== undefined) update.is_active = dto.is_active;
    const { data, error } = await supabase.from('promo_codes').update(update).eq('id', id).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Promo code deleted' };
  }

  /** Increment usage count (call after order is paid). */
  async incrementUsage(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const promo = await this.findOne(id);
    const newCount = (promo.current_usage_count || 0) + 1;
    const { error } = await supabase.from('promo_codes').update({ current_usage_count: newCount }).eq('id', id);
    if (error) throw new BadRequestException(error.message);
  }
}
