import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDeliveryDayDto, DeliveryDayStatus } from './dto/create-delivery-day.dto';
import { UpdateDeliveryDayDto } from './dto/update-delivery-day.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { BulkUpdateDeliveryDaysDto } from './dto/bulk-update-delivery-days.dto';

@Injectable()
export class DeliveryService {
  constructor(private supabaseService: SupabaseService) {}

  // ========== CUSTOMER-FACING METHODS ==========

  async getTimeSlots() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_time_slots')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async getAvailableDates(startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    // If no records exist, return all dates as available (backward compatibility)
    if (!data || data.length === 0) {
      return [];
    }

    return data;
  }

  async isDateAvailable(date: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_days')
      .select('status')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new BadRequestException(error.message);
    }

    // If no record exists, date is available (backward compatibility)
    if (!data) {
      return true;
    }

    return data.status === 'available';
  }

  async getDateAvailability(date: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      return {
        date,
        status: 'available',
        capacity: null,
        current_orders: 0,
        is_available: true,
      };
    }

    return {
      ...data,
      is_available: data.status === 'available',
    };
  }

  // ========== ADMIN METHODS - DELIVERY DAYS ==========

  async getAllDeliveryDays(startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async getDeliveryDay(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Delivery day not found');

    return data;
  }

  async getDeliveryDayByDate(date: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async createDeliveryDay(dto: CreateDeliveryDayDto) {
    const supabase = this.supabaseService.getClient();
    
    // Check if date already exists
    const existing = await this.getDeliveryDayByDate(dto.date);
    if (existing) {
      throw new BadRequestException('Delivery day for this date already exists');
    }

    const { data, error } = await supabase
      .from('delivery_days')
      .insert({
        date: dto.date,
        status: dto.status,
        capacity: dto.capacity || null,
        admin_note: dto.admin_note || null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async updateDeliveryDay(id: string, dto: UpdateDeliveryDayDto) {
    const supabase = this.supabaseService.getClient();
    
    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.admin_note !== undefined) updateData.admin_note = dto.admin_note;

    const { data, error } = await supabase
      .from('delivery_days')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Delivery day not found');
      }
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async updateDeliveryDayByDate(date: string, dto: UpdateDeliveryDayDto) {
    const supabase = this.supabaseService.getClient();
    
    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.admin_note !== undefined) updateData.admin_note = dto.admin_note;

    const { data, error } = await supabase
      .from('delivery_days')
      .update(updateData)
      .eq('date', date)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create if doesn't exist
        return this.createDeliveryDay({
          date,
          status: dto.status || DeliveryDayStatus.AVAILABLE,
          capacity: dto.capacity,
          admin_note: dto.admin_note,
        });
      }
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async bulkUpdateDeliveryDays(dto: BulkUpdateDeliveryDaysDto) {
    const results = [];
    for (const day of dto.days) {
      try {
        const existing = await this.getDeliveryDayByDate(day.date);
        if (existing) {
          const updated = await this.updateDeliveryDay(existing.id, {
            status: day.status,
            capacity: day.capacity,
            admin_note: day.admin_note,
          });
          results.push(updated);
        } else {
          const created = await this.createDeliveryDay(day);
          results.push(created);
        }
      } catch (error) {
        results.push({ error: error.message, date: day.date });
      }
    }
    return results;
  }

  async deleteDeliveryDay(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('delivery_days')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { success: true };
  }

  async resetAllDeliveryDays() {
    const supabase = this.supabaseService.getClient();
    
    // Get all delivery days first to delete them
    const { data: allDays, error: fetchError } = await supabase
      .from('delivery_days')
      .select('id');

    if (fetchError) throw new BadRequestException(fetchError.message);

    // Delete all delivery days
    if (allDays && allDays.length > 0) {
      const ids = allDays.map(day => day.id);
      const { error } = await supabase
        .from('delivery_days')
        .delete()
        .in('id', ids);

      if (error) throw new BadRequestException(error.message);
    }

    return { success: true, message: 'All delivery days have been reset to default (all dates available)' };
  }

  // ========== ADMIN METHODS - TIME SLOTS ==========

  async getAllTimeSlots() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_time_slots')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async getTimeSlot(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('delivery_time_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Time slot not found');

    return data;
  }

  async createTimeSlot(dto: CreateTimeSlotDto) {
    const supabase = this.supabaseService.getClient();
    
    // Normalize time format
    const startTime = this.normalizeTime(dto.start_time);
    const endTime = this.normalizeTime(dto.end_time);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const { data, error } = await supabase
      .from('delivery_time_slots')
      .insert({
        label: dto.label,
        start_time: startTime,
        end_time: endTime,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        display_order: dto.display_order || 0,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async updateTimeSlot(id: string, dto: UpdateTimeSlotDto) {
    const supabase = this.supabaseService.getClient();
    
    const updateData: any = {};
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.start_time !== undefined) updateData.start_time = this.normalizeTime(dto.start_time);
    if (dto.end_time !== undefined) updateData.end_time = this.normalizeTime(dto.end_time);
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    if (dto.display_order !== undefined) updateData.display_order = dto.display_order;

    // Validate time range if both times are being updated
    if (dto.start_time !== undefined && dto.end_time !== undefined) {
      const startTime = this.normalizeTime(dto.start_time);
      const endTime = this.normalizeTime(dto.end_time);
      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    } else if (dto.start_time !== undefined || dto.end_time !== undefined) {
      // If only one is being updated, fetch current values
      const current = await this.getTimeSlot(id);
      const startTime = dto.start_time ? this.normalizeTime(dto.start_time) : current.start_time;
      const endTime = dto.end_time ? this.normalizeTime(dto.end_time) : current.end_time;
      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const { data, error } = await supabase
      .from('delivery_time_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Time slot not found');
      }
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async deleteTimeSlot(id: string) {
    const supabase = this.supabaseService.getClient();
    
    // Check if any orders use this time slot
    const { data: orders, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('delivery_time_slot_id', id)
      .limit(1);

    if (checkError) throw new BadRequestException(checkError.message);

    if (orders && orders.length > 0) {
      throw new BadRequestException('Cannot delete time slot that has associated orders');
    }

    const { error } = await supabase
      .from('delivery_time_slots')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { success: true };
  }

  async reorderTimeSlots(slotIds: string[]) {
    const supabase = this.supabaseService.getClient();
    
    const updates = slotIds.map((id, index) => ({
      id,
      display_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('delivery_time_slots')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) throw new BadRequestException(error.message);
    }

    return { success: true };
  }

  // ========== HELPER METHODS ==========

  private normalizeTime(time: string): string {
    // Convert "HH:MM" to "HH:MM:SS"
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }
    // Already in "HH:MM:SS" format
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }
    throw new BadRequestException(`Invalid time format: ${time}. Use HH:MM or HH:MM:SS`);
  }
}
