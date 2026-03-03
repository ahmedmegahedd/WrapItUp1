import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (adminError || !admin) {
      throw new UnauthorizedException('User is not an admin');
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
    };
  }

  async verifyAdmin(userId: string): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  }

  /**
   * Load admin's role and permission keys for RBAC.
   * If admin has no role or RBAC tables are missing, treat as super admin (full access) so
   * existing admins can always access the panel until roles are set up.
   */
  async getAdminRoleAndPermissions(userId: string): Promise<{
    role_id: string | null;
    role_name: string | null;
    is_super_admin: boolean;
    permissions: string[];
  }> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role_id')
      .eq('id', userId)
      .single();

    if (adminError || !admin) {
      return { role_id: null, role_name: null, is_super_admin: false, permissions: [] };
    }

    // No role assigned → full access so you can always reach the panel and set up RBAC
    if (!admin.role_id) {
      return { role_id: null, role_name: null, is_super_admin: true, permissions: [] };
    }

    let role: { id: string; name: string; is_super_admin: boolean } | null = null;
    try {
      const { data, error: roleError } = await supabase
        .from('admin_roles')
        .select('id, name, is_super_admin')
        .eq('id', admin.role_id)
        .single();
      if (!roleError && data) role = data;
    } catch {
      // admin_roles table might not exist yet
    }

    // Role table missing or role not found → full access
    if (!role) {
      return { role_id: admin.role_id, role_name: null, is_super_admin: true, permissions: [] };
    }

    if (role.is_super_admin) {
      return {
        role_id: role.id,
        role_name: role.name,
        is_super_admin: true,
        permissions: [], // not needed; guard allows all
      };
    }

    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', role.id);
    const permIds = (rolePerms ?? []).map((p: { permission_id: string }) => p.permission_id);
    if (permIds.length === 0) {
      return {
        role_id: role.id,
        role_name: role.name,
        is_super_admin: false,
        permissions: [],
      };
    }

    const { data: perms } = await supabase
      .from('admin_permissions')
      .select('key')
      .in('id', permIds);
    const permissions = (perms ?? []).map((p: { key: string }) => p.key);

    return {
      role_id: role.id,
      role_name: role.name,
      is_super_admin: false,
      permissions,
    };
  }

  /** Get admin display name (from profiles) for order notes. */
  async getAdminDisplayName(userId: string): Promise<string> {
    const supabase = this.supabaseService.getAdminClient();
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    const name = data?.full_name?.trim();
    if (name) return name;
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    return authUser?.user?.email ?? userId;
  }
}
