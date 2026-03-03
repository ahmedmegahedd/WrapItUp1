import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get date range based on time range filter
   */
  private getDateRange(timeRange?: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timeRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'last_7_days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_30_days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (startDate) {
          start = new Date(startDate);
        } else {
          start = new Date(now);
          start.setDate(start.getDate() - 30);
        }
        if (endDate) {
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        // Default to last 30 days
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  /**
   * Track product click
   */
  async trackProductClick(productId: string, sessionId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('product_clicks').insert({
      product_id: productId,
      session_id: sessionId,
    });

    if (error) {
      console.error('Error tracking product click:', error);
    }
  }

  /**
   * Update or create user session
   */
  async updateUserSession(sessionId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.rpc('upsert_user_session', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Error updating user session:', error);
    }
  }

  /**
   * Get product clicks with counts
   */
  async getProductClicks() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('product_clicks')
      .select('product_id')
      .order('clicked_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Aggregate clicks by product
    const clickCounts = new Map<string, number>();
    data.forEach((click: any) => {
      const productId = click.product_id;
      clickCounts.set(productId, (clickCounts.get(productId) || 0) + 1);
    });

    // Get product details for products with clicks
    const productIds = Array.from(clickCounts.keys());
    if (productIds.length === 0) {
      return [];
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, slug')
      .in('id', productIds);

    if (productsError) throw new Error(productsError.message);

    // Combine click counts with product details
    const result = products.map((product: any) => ({
      product_id: product.id,
      product_title: product.title,
      product_slug: product.slug,
      click_count: clickCounts.get(product.id) || 0,
    }));

    return result.sort((a, b) => b.click_count - a.click_count);
  }

  /**
   * Get daily users count
   */
  async getDailyUsers(timeRange?: string) {
    const supabase = this.supabaseService.getClient();
    const { start, end } = this.getDateRange(timeRange);

    const { data, error } = await supabase
      .from('user_sessions')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw new Error(error.message);

    // Group by date
    const dailyCounts: Record<string, number> = {};
    data.forEach((session: any) => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      today: this.getTodayCount(data),
      last7Days: this.getLastNDaysCount(data, 7),
      last30Days: this.getLastNDaysCount(data, 30),
      dailyBreakdown: dailyCounts,
    };
  }

  private getTodayCount(sessions: any[]): number {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter((s) => new Date(s.created_at).toISOString().split('T')[0] === today).length;
  }

  private getLastNDaysCount(sessions: any[], days: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sessions.filter((s) => new Date(s.created_at) >= cutoff).length;
  }

  /**
   * Get live users (active in last X seconds)
   */
  async getLiveUsers(activeSeconds: number = 60) {
    const supabase = this.supabaseService.getClient();
    const cutoff = new Date();
    cutoff.setSeconds(cutoff.getSeconds() - activeSeconds);

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .gte('last_activity_at', cutoff.toISOString());

    if (error) throw new Error(error.message);

    return {
      count: data.length,
      activeSeconds,
    };
  }

  /**
   * Get conversion counts
   */
  async getConversionCounts(timeRange?: string, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    // Get orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .eq('payment_status', 'paid');

    if (ordersError) throw new Error(ordersError.message);

    // Get unique sessions in date range
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (sessionsError) throw new Error(sessionsError.message);

    const orderCount = orders.length;
    const sessionCount = sessions.length;
    const conversionRate = sessionCount > 0 ? (orderCount / sessionCount) * 100 : 0;

    return {
      orders: orderCount,
      sessions: sessionCount,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  /**
   * Get best selling products (ranked by orders and revenue)
   */
  async getBestSellingProducts() {
    const supabase = this.supabaseService.getClient();

    // Get all paid orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid');

    if (ordersError) throw new Error(ordersError.message);

    const orderIds = orders.map((o) => o.id);

    if (orderIds.length === 0) {
      return [];
    }

    // Get order items for paid orders
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, line_total')
      .in('order_id', orderIds);

    if (itemsError) throw new Error(itemsError.message);

    // Aggregate by product
    const productStats = new Map<
      string,
      {
        product_id: string;
        product_title: string;
        product_slug: string;
        orders_count: number;
        total_revenue: number;
        total_quantity: number;
      }
    >();

    orderItems.forEach((item: any) => {
      if (!item.product_id) return;

      if (!productStats.has(item.product_id)) {
        productStats.set(item.product_id, {
          product_id: item.product_id,
          product_title: '',
          product_slug: '',
          orders_count: 0,
          total_revenue: 0,
          total_quantity: 0,
        });
      }

      const stats = productStats.get(item.product_id)!;
      stats.orders_count++;
      stats.total_revenue += parseFloat(item.line_total || 0);
      stats.total_quantity += item.quantity || 0;
    });

    // Get product details
    const productIds = Array.from(productStats.keys());
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, slug')
      .in('id', productIds);

    if (productsError) throw new Error(productsError.message);

    // Map product details
    products.forEach((product: any) => {
      const stats = productStats.get(product.id);
      if (stats) {
        stats.product_title = product.title;
        stats.product_slug = product.slug;
      }
    });

    // Convert to array and sort by orders count, then revenue
    const result = Array.from(productStats.values())
      .filter((p) => p.product_title) // Only include products that still exist
      .sort((a, b) => {
        if (b.orders_count !== a.orders_count) {
          return b.orders_count - a.orders_count;
        }
        return b.total_revenue - a.total_revenue;
      })
      .map((p, index) => ({
        rank: index + 1,
        ...p,
      }));

    return result;
  }

  /**
   * Get total sales and orders summary
   */
  async getSalesSummary(timeRange?: string, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .eq('payment_status', 'paid');

    if (error) throw new Error(error.message);

    const totalOrders = data.length;
    const totalSales = data.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

    return {
      totalOrders,
      totalSales: parseFloat(totalSales.toFixed(2)),
    };
  }

  /**
   * Get peak order hours (last 7 days)
   */
  async getPeakOrderHours() {
    const supabase = this.supabaseService.getClient();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .eq('payment_status', 'paid');

    if (error) throw new Error(error.message);

    // Group by hour
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    data.forEach((order: any) => {
      const hour = new Date(order.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        hourLabel: `${hour.toString().padStart(2, '0')}:00-${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return result;
  }

  // ----- Customer analytics (RPC-based, scalable) -----

  async getRepeatCustomerRate() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc('get_analytics_repeat_customer_rate');
    if (error) throw new Error(error.message);
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      total_customers: Number(r.total_customers ?? 0),
      repeat_customers: Number(r.repeat_customers ?? 0),
      repeat_rate: Number(r.repeat_rate ?? 0),
    };
  }

  async getCustomerLifetimeValue() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc('get_analytics_customer_lifetime_value');
    if (error) throw new Error(error.message);
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      average_order_value: Number(r.average_order_value ?? 0),
      average_orders_per_customer: Number(r.average_orders_per_customer ?? 0),
      clv: Number(r.clv ?? 0),
    };
  }

  async getTopCustomers(limit = 20, sortBy: 'revenue' | 'orders' = 'revenue') {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc('get_analytics_top_customers', {
      p_limit: limit,
      p_sort_by: sortBy,
    });
    if (error) throw new Error(error.message);
    const list = Array.isArray(data) ? data : [];
    return list.map((row: any) => ({
      user_id: row.user_id ?? null,
      name: row.name ?? row.email ?? '—',
      email: row.email ?? '',
      total_orders: Number(row.total_orders ?? 0),
      total_spent: Number(row.total_spent ?? 0),
      last_order_date: row.last_order_date ?? null,
    }));
  }

  async getRetention(days: number) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc('get_analytics_retention', { p_days: days });
    if (error) throw new Error(error.message);
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      period_days: Number(r.period_days ?? days),
      cohort_size: Number(r.cohort_size ?? 0),
      returned_customers: Number(r.returned_customers ?? 0),
      retention_rate: Number(r.retention_rate ?? 0),
    };
  }

  async getAbandonedCheckout() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc('get_analytics_abandoned_checkout');
    if (error) throw new Error(error.message);
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      total_checkouts: Number(r.total_checkouts ?? 0),
      abandoned: Number(r.abandoned ?? 0),
      abandonment_rate: Number(r.abandonment_rate ?? 0),
    };
  }

  /** Track start-checkout (public). user_id optional for guests. */
  async trackStartCheckout(userId: string | null, cartValue: number) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('checkout_events').insert({
      user_id: userId || null,
      cart_value: cartValue,
      converted: false,
    });
    if (error) console.error('Error tracking start-checkout:', error);
  }

  /** Mark latest unconverted checkout event for this customer (by email) as converted. Call when order is created. */
  async markCheckoutConverted(customerEmail: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();
    const userId = profile?.id ?? null;
    if (!userId) return;
    const { data: events } = await supabase
      .from('checkout_events')
      .select('id')
      .eq('user_id', userId)
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1);
    if (events?.length) {
      await supabase.from('checkout_events').update({ converted: true }).eq('id', events[0].id);
    }
  }
}
