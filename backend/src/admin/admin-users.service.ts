import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface UserListRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  last_activity: string | null;
  total_orders: number;
  points_balance: number;
}

export interface UserDetailOrder {
  id: string;
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  total: number;
  points_earned: number;
  delivery_date: string;
  delivery_time_slot: string;
  order_items: Array<{
    product_title: string;
    quantity: number;
    line_total: number;
    selected_variations?: Record<string, string>;
    selected_addons?: Array<{ name: string; price: number }>;
  }>;
}

export interface UserDetail {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string | null;
  total_orders: number;
  points_balance: number;
  orders: UserDetailOrder[];
  cart: null; // Server has no cart; cart is device-only
}

export interface UserExportRow {
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  last_activity: string | null;
  total_orders: number;
  points_balance: number;
  cart_items: string; // "Not available (stored on device)"
  orders_summary: string; // Flattened: order numbers, dates, totals
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Paginated list of users (profiles) with order counts, last activity, points balance.
   * Search: case-insensitive partial match on full_name, email, phone.
   */
  async getUsersPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: UserListRow[]; total: number }> {
    const supabase = this.supabaseService.getAdminClient();
    const from = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at, updated_at', { count: 'exact' });

    if (search && search.trim()) {
      const raw = search.trim().replace(/"/g, '""');
      const pattern = `%${raw}%`;
      const val = pattern.includes(',') ? `"${pattern}"` : pattern;
      query = query.or(`full_name.ilike.${val},email.ilike.${val},phone.ilike.${val}`);
    }

    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) throw new NotFoundException(profilesError.message);

    const total = count ?? 0;
    if (!profiles?.length) {
      return { data: [], total };
    }

    const emails = profiles.map((p: any) => p.email);

    const [orderAggregates, loyaltyBalances] = await Promise.all([
      this.getOrderAggregatesByEmails(supabase, emails),
      this.getPointsBalancesByEmails(supabase, emails),
    ]);

    const data: UserListRow[] = profiles.map((p: any) => ({
      id: p.id,
      full_name: p.full_name ?? null,
      email: p.email,
      phone: p.phone ?? null,
      created_at: p.created_at,
      last_activity: orderAggregates[p.email]?.last_activity ?? null,
      total_orders: orderAggregates[p.email]?.total_orders ?? 0,
      points_balance: loyaltyBalances[p.email] ?? 0,
    }));

    return { data, total };
  }

  /** Get order count and last activity per email (single query). */
  private async getOrderAggregatesByEmails(
    supabase: any,
    emails: string[],
  ): Promise<Record<string, { total_orders: number; last_activity: string | null }>> {
    if (emails.length === 0) return {};

    const { data, error } = await supabase
      .from('orders')
      .select('customer_email, created_at, updated_at')
      .in('customer_email', emails);

    if (error) return {};

    const map: Record<string, { total_orders: number; last_activity: string | null }> = {};
    for (const email of emails) {
      map[email] = { total_orders: 0, last_activity: null };
    }
    for (const row of data || []) {
      const e = row.customer_email;
      if (!map[e]) map[e] = { total_orders: 0, last_activity: null };
      map[e].total_orders += 1;
      const ts = row.updated_at || row.created_at;
      if (ts && (!map[e].last_activity || ts > map[e].last_activity)) {
        map[e].last_activity = ts;
      }
    }
    return map;
  }

  /** Get points balance per email from loyalty_accounts. */
  private async getPointsBalancesByEmails(
    supabase: any,
    emails: string[],
  ): Promise<Record<string, number>> {
    if (emails.length === 0) return {};

    const { data, error } = await supabase
      .from('loyalty_accounts')
      .select('email, points_balance')
      .in('email', emails);

    if (error) return {};

    const map: Record<string, number> = {};
    for (const row of data || []) {
      map[row.email] = row.points_balance ?? 0;
    }
    return map;
  }

  /** Single user detail with orders (and order_items). Cart not available server-side. */
  async getUserDetail(id: string): Promise<UserDetail> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at, updated_at')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException('User not found');
    }

    const email = profile.email;

    const [orderAggregates, loyaltyBalances, ordersData] = await Promise.all([
      this.getOrderAggregatesByEmails(supabase, [email]),
      this.getPointsBalancesByEmails(supabase, [email]),
      supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          order_status,
          payment_status,
          payment_method,
          total,
          points_earned,
          delivery_date,
          delivery_time_slot,
          order_items(*)
        `)
        .eq('customer_email', email)
        .order('created_at', { ascending: false }),
    ]);

    const agg = orderAggregates[email];
    const orders: UserDetailOrder[] = (ordersData.data || []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      order_status: o.order_status,
      payment_status: o.payment_status,
      payment_method: o.payment_method ?? null,
      total: parseFloat(o.total ?? 0),
      points_earned: o.points_earned ?? 0,
      delivery_date: o.delivery_date,
      delivery_time_slot: o.delivery_time_slot ?? '',
      order_items: (o.order_items || []).map((i: any) => ({
        product_title: i.product_title,
        quantity: i.quantity,
        line_total: parseFloat(i.line_total ?? 0),
        selected_variations: i.selected_variations ?? undefined,
        selected_addons: i.selected_addons ?? undefined,
      })),
    }));

    return {
      id: profile.id,
      full_name: profile.full_name ?? null,
      email: profile.email,
      phone: profile.phone ?? null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_activity: agg?.last_activity ?? null,
      total_orders: agg?.total_orders ?? 0,
      points_balance: loyaltyBalances[email] ?? 0,
      orders,
      cart: null,
    };
  }

  /** All users with same aggregates for export. No pagination. */
  async getUsersForExport(search?: string): Promise<UserExportRow[]> {
    const supabase = this.supabaseService.getAdminClient();

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at');

    if (search && search.trim()) {
      const raw = search.trim().replace(/"/g, '""');
      const pattern = `%${raw}%`;
      const val = pattern.includes(',') ? `"${pattern}"` : pattern;
      query = query.or(`full_name.ilike.${val},email.ilike.${val},phone.ilike.${val}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: profiles, error } = await query;
    if (error || !profiles?.length) return [];

    const emails = profiles.map((p: any) => p.email);

    const [orderAggregates, loyaltyBalances, ordersByEmail] = await Promise.all([
      this.getOrderAggregatesByEmails(supabase, emails),
      this.getPointsBalancesByEmails(supabase, emails),
      this.getOrdersSummaryByEmails(supabase, emails),
    ]);

    return profiles.map((p: any) => {
      const email = p.email;
      const ordersSummary = ordersByEmail[email] ?? '';
      return {
        user_id: p.id,
        full_name: p.full_name ?? null,
        email: p.email,
        phone: p.phone ?? null,
        created_at: p.created_at,
        last_activity: orderAggregates[email]?.last_activity ?? null,
        total_orders: orderAggregates[email]?.total_orders ?? 0,
        points_balance: loyaltyBalances[email] ?? 0,
        cart_items: 'Not available (stored on device)',
        orders_summary: ordersSummary,
      };
    });
  }

  /** Per-email flattened orders summary for export (one string per user). */
  private async getOrdersSummaryByEmails(
    supabase: any,
    emails: string[],
  ): Promise<Record<string, string>> {
    if (emails.length === 0) return {};

    const { data, error } = await supabase
      .from('orders')
      .select('customer_email, order_number, created_at, order_status, total, delivery_date, delivery_time_slot')
      .in('customer_email', emails)
      .order('created_at', { ascending: false });

    if (error) return {};

    const map: Record<string, string[]> = {};
    for (const email of emails) map[email] = [];
    for (const row of data || []) {
      const line = `${row.order_number} | ${row.created_at} | ${row.order_status} | ${row.total} EGP | ${row.delivery_date} ${row.delivery_time_slot || ''}`.trim();
      map[row.customer_email].push(line);
    }
    const result: Record<string, string> = {};
    for (const email of emails) {
      result[email] = map[email].length ? map[email].join(' ; ') : '';
    }
    return result;
  }
}
