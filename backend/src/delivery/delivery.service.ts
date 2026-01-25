import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DeliveryService {
  constructor(private supabaseService: SupabaseService) {}

  async getTimeSlots() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async getDisabledDates() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('disabled_delivery_dates')
      .select('disabled_date')
      .gte('disabled_date', new Date().toISOString().split('T')[0]);

    if (error) throw new BadRequestException(error.message);

    return (data || []).map((item) => item.disabled_date);
  }

  async isDateAvailable(date: string): Promise<boolean> {
    const disabledDates = await this.getDisabledDates();
    return !disabledDates.includes(date);
  }
}
