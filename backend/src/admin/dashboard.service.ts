import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getAdminClient();
  }

  /** Server local today 00:00 and tomorrow 00:00 as ISO (UTC). */
  private getTodayBounds(): { start: string; end: string; dateStr: string } {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const start = new Date(y, m, day, 0, 0, 0, 0);
    const end = new Date(y, m, day + 1, 0, 0, 0, 0);
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { start: start.toISOString(), end: end.toISOString(), dateStr };
  }

  /** Yesterday bounds in server local time. */
  private getYesterdayBounds(): { start: string; end: string } {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const start = new Date(y, m, day - 1, 0, 0, 0, 0);
    const end = new Date(y, m, day, 0, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  async getTodayOverview() {
    const { start, end, dateStr } = this.getTodayBounds();
    const { data, error } = await this.supabase.rpc('get_dashboard_today', {
      p_start: start,
      p_end: end,
    });
    if (error) {
      throw new BadRequestException(error.message || 'Failed to load today overview');
    }
    const result = data as Record<string, unknown>;
    return {
      date: dateStr,
      total_orders: Number(result?.total_orders ?? 0),
      total_revenue: Number(result?.total_revenue ?? 0),
      paid_orders: Number(result?.paid_orders ?? 0),
      pending_orders: Number(result?.pending_orders ?? 0),
      preparing_orders: Number(result?.preparing_orders ?? 0),
      out_for_delivery: Number(result?.out_for_delivery ?? 0),
      delivered_orders: Number(result?.delivered_orders ?? 0),
      cancelled_orders: Number(result?.cancelled_orders ?? 0),
      cod_orders: Number(result?.cod_orders ?? 0),
      online_paid_orders: Number(result?.online_paid_orders ?? 0),
      average_order_value: Number(result?.average_order_value ?? 0),
      orders: Array.isArray(result?.orders) ? result.orders : [],
    };
  }

  async getAlerts() {
    const { start, end } = this.getTodayBounds();
    const d = new Date();
    const deliveryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const { data, error } = await this.supabase.rpc('get_dashboard_alerts', {
      p_today_start: start,
      p_today_end: end,
      p_delivery_date: deliveryDate,
    });
    if (error) {
      throw new BadRequestException(error.message || 'Failed to load alerts');
    }
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      pending_payment: Number(r.pending_payment ?? 0),
      delayed_preparing: Number(r.delayed_preparing ?? 0),
      late_delivery: Number(r.late_delivery ?? 0),
    };
  }

  async getDeliveryLoadToday() {
    const d = new Date();
    const deliveryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const { data, error } = await this.supabase.rpc('get_dashboard_delivery_load', {
      p_delivery_date: deliveryDate,
    });
    if (error) {
      throw new BadRequestException(error.message || 'Failed to load delivery load');
    }
    const r = (data ?? {}) as Record<string, unknown>;
    const bySlot = (Array.isArray(r.by_slot) ? r.by_slot : []) as Array<{ time_slot: string; cnt: number }>;
    const mostLoaded = bySlot.length ? bySlot[0] : null;
    return {
      delivery_date: r.delivery_date,
      total_deliveries: Number(r.total_deliveries ?? 0),
      by_slot: bySlot.map((s) => ({ time_slot: s.time_slot, orders: Number(s.cnt ?? 0) })),
      most_loaded_slot: mostLoaded ? { time_slot: mostLoaded.time_slot, orders: Number(mostLoaded.cnt ?? 0) } : null,
    };
  }

  async getLowStockProducts(threshold = 5) {
    const { data, error } = await this.supabase.rpc('get_low_stock_products', {
      p_threshold: threshold,
    });
    if (error) {
      throw new BadRequestException(error.message || 'Failed to load low stock');
    }
    return Array.isArray(data) ? data : [];
  }

  async getRevenueComparison() {
    const { start: todayStart, end: todayEnd } = this.getTodayBounds();
    const { start: yesterdayStart, end: yesterdayEnd } = this.getYesterdayBounds();
    const { data, error } = await this.supabase.rpc('get_revenue_comparison', {
      p_today_start: todayStart,
      p_today_end: todayEnd,
      p_yesterday_start: yesterdayStart,
      p_yesterday_end: yesterdayEnd,
    });
    if (error) {
      throw new BadRequestException(error.message || 'Failed to load revenue comparison');
    }
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      revenue_today: Number(r.revenue_today ?? 0),
      revenue_yesterday: Number(r.revenue_yesterday ?? 0),
      percent_change: Number(r.percent_change ?? 0),
    };
  }
}
