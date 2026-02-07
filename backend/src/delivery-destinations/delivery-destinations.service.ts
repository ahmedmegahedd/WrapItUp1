import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DeliveryDestinationsService {
  constructor(private supabaseService: SupabaseService) {}

  /** Public: list active destinations for checkout. */
  async findAllActive() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_destinations')
      .select('id, name, fee_egp, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findAll(includeInactive = false) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('delivery_destinations').select('*').order('display_order', { ascending: true });
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('delivery_destinations').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Delivery destination not found');
    return data;
  }

  async create(payload: { name: string; fee_egp: number; display_order?: number; is_active?: boolean }) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('delivery_destinations')
      .insert({
        name: payload.name,
        fee_egp: payload.fee_egp,
        display_order: payload.display_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(
    id: string,
    payload: { name?: string; fee_egp?: number; display_order?: number; is_active?: boolean },
  ) {
    const supabase = this.supabaseService.getAdminClient();
    await this.findOne(id);
    const { data, error } = await supabase.from('delivery_destinations').update(payload).eq('id', id).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('delivery_destinations').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Delivery destination deleted' };
  }
}
