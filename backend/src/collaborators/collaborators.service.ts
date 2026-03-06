import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { UpdateCollaboratorDto } from './dto/update-collaborator.dto';

@Injectable()
export class CollaboratorsService {
  constructor(private supabaseService: SupabaseService) {}

  async createCollaborator(dto: CreateCollaboratorDto) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: admin, error: adminErr } = await supabase
      .from('admins')
      .select('id, email')
      .eq('id', dto.adminId)
      .single();
    if (adminErr || !admin) {
      throw new BadRequestException('Admin account not found');
    }

    const { data: existing } = await supabase
      .from('collaborators')
      .select('id')
      .eq('admin_id', dto.adminId)
      .maybeSingle();
    if (existing) {
      throw new BadRequestException('This admin is already a collaborator');
    }

    const { data: collaborator, error } = await supabase
      .from('collaborators')
      .insert({
        admin_id: dto.adminId,
        brand_name: dto.brand_name.trim(),
        contact_email: dto.contact_email?.trim() || null,
        contact_phone: dto.contact_phone?.trim() || null,
        commission_rate: dto.commission_rate,
        notes: dto.notes?.trim() || null,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return this.getCollaboratorById(collaborator.id);
  }

  async getAllCollaborators(): Promise<any[]> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: rows, error } = await supabase
      .from('collaborators')
      .select(`
        *,
        admins(id, email)
      `)
      .order('brand_name');
    if (error) throw new BadRequestException(error.message);

    const result = [];
    for (const row of rows ?? []) {
      const admin = (row as any).admins;
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('collaborator_id', row.id);
      const { data: commissionSum } = await supabase
        .from('commission_records')
        .select('commission_amount')
        .eq('collaborator_id', row.id)
        .eq('payout_status', 'pending');
      const totalPending = (commissionSum ?? []).reduce(
        (s: number, r: any) => s + parseFloat(r.commission_amount || 0),
        0,
      );
      result.push({
        ...row,
        admin_email: admin?.email ?? null,
        product_count: productCount ?? 0,
        total_commission_pending: totalPending,
      });
    }
    return result;
  }

  async getCollaboratorById(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: row, error } = await supabase
      .from('collaborators')
      .select(`*, admins(id, email)`)
      .eq('id', id)
      .single();
    if (error || !row) throw new NotFoundException('Collaborator not found');

    const { data: products } = await supabase
      .from('products')
      .select('id, title, approval_status, is_active, created_at')
      .eq('collaborator_id', id)
      .order('created_at', { ascending: false });

    const { data: commissionRows } = await supabase
      .from('commission_records')
      .select('*')
      .eq('collaborator_id', id)
      .order('created_at', { ascending: false })
      .limit(100);
    const totalCommission = (commissionRows ?? []).reduce(
      (s: number, r: any) => s + parseFloat(r.commission_amount || 0),
      0,
    );
    const pendingPayout = (commissionRows ?? [])
      .filter((r: any) => r.payout_status === 'pending')
      .reduce((s: number, r: any) => s + parseFloat(r.commission_amount || 0), 0);

    return {
      ...row,
      admin_email: (row as any).admins?.email ?? null,
      products: products ?? [],
      total_commission_earned: totalCommission,
      pending_payout: pendingPayout,
    };
  }

  async getCollaboratorByAdminId(adminId: string): Promise<{ id: string; brand_name: string; commission_rate: number } | null> {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('collaborators')
      .select('id, brand_name, commission_rate, is_active')
      .eq('admin_id', adminId)
      .maybeSingle();
    if (error || !data || !data.is_active) return null;
    return { id: data.id, brand_name: data.brand_name, commission_rate: parseFloat(String(data.commission_rate ?? 0)) };
  }

  async updateCollaborator(id: string, dto: UpdateCollaboratorDto) {
    const supabase = this.supabaseService.getAdminClient();
    await this.getCollaboratorById(id);
    const update: any = { updated_at: new Date().toISOString() };
    if (dto.brand_name !== undefined) update.brand_name = dto.brand_name.trim();
    if (dto.contact_email !== undefined) update.contact_email = dto.contact_email?.trim() || null;
    if (dto.contact_phone !== undefined) update.contact_phone = dto.contact_phone?.trim() || null;
    if (dto.commission_rate !== undefined) update.commission_rate = dto.commission_rate;
    if (dto.notes !== undefined) update.notes = dto.notes?.trim() || null;
    if (dto.is_active !== undefined) update.is_active = dto.is_active;
    const { error } = await supabase.from('collaborators').update(update).eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return this.getCollaboratorById(id);
  }

  async getCollaboratorEarnings(
    collaboratorId: string,
    filters?: { dateFrom?: string; dateTo?: string; payoutStatus?: string },
  ) {
    const supabase = this.supabaseService.getAdminClient();
    await this.getCollaboratorById(collaboratorId);
    let query = supabase
      .from('commission_records')
      .select('*')
      .eq('collaborator_id', collaboratorId)
      .order('created_at', { ascending: false });
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z');
    if (filters?.payoutStatus) query = query.eq('payout_status', filters.payoutStatus);
    const { data: records, error } = await query;
    if (error) throw new BadRequestException(error.message);
    const list = records ?? [];
    const total_subtotal = list.reduce((s, r) => s + parseFloat(r.subtotal || 0), 0);
    const total_commission = list.reduce((s, r) => s + parseFloat(r.commission_amount || 0), 0);
    const total_wrapitup = list.reduce((s, r) => s + parseFloat(r.wrapitup_amount || 0), 0);
    const pending_payout = list.filter((r) => r.payout_status === 'pending').reduce((s, r) => s + parseFloat(r.commission_amount || 0), 0);
    const paid_payout = list.filter((r) => r.payout_status === 'paid').reduce((s, r) => s + parseFloat(r.commission_amount || 0), 0);
    return {
      records: list,
      summary: {
        total_subtotal,
        total_commission,
        total_wrapitup,
        pending_payout,
        paid_payout,
      },
    };
  }

  async markCommissionPaid(recordIds: string[], note: string, collaboratorId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    if (recordIds.length === 0) return { updated: 0 };
    let query = supabase.from('commission_records').update({
      payout_status: 'paid',
      payout_note: note?.trim() || null,
    }).in('id', recordIds);
    if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);
    const { data, error } = await query.select('id');
    if (error) throw new BadRequestException(error.message);
    return { updated: (data ?? []).length };
  }
}
