import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminCredentialsDto } from './dto/create-admin-credentials.dto';

const SUPER_ADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class AdminRolesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getAdminClient();
  }

  async getRoles() {
    const { data, error } = await this.supabase
      .from('admin_roles')
      .select('id, name, is_super_admin, created_at')
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getRole(id: string) {
    const { data: role, error: roleError } = await this.supabase
      .from('admin_roles')
      .select('id, name, is_super_admin, created_at, updated_at')
      .eq('id', id)
      .single();
    if (roleError || !role) throw new NotFoundException('Role not found');

    const { data: rp } = await this.supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', id);
    const permissionIds = (rp ?? []).map((p: { permission_id: string }) => p.permission_id);
    let perms: unknown[] = [];
    if (permissionIds.length > 0) {
      const { data } = await this.supabase
        .from('admin_permissions')
        .select('id, key, label, permission_group, display_order')
        .in('id', permissionIds);
      perms = data ?? [];
    }
    return {
      ...role,
      permission_ids: permissionIds,
      permissions: perms,
    };
  }

  async createRole(dto: CreateRoleDto) {
    if (dto.is_super_admin === true) {
      throw new BadRequestException('Cannot create a new Super Admin role');
    }
    const { data: role, error: roleError } = await this.supabase
      .from('admin_roles')
      .insert({
        name: dto.name.trim(),
        is_super_admin: false,
      })
      .select('id, name, is_super_admin')
      .single();
    if (roleError) throw new BadRequestException(roleError.message);

    if (dto.permission_ids?.length) {
      const rows = dto.permission_ids.map((permission_id) => ({
        role_id: role.id,
        permission_id,
      }));
      const { error: rpError } = await this.supabase.from('role_permissions').insert(rows);
      if (rpError) throw new BadRequestException(rpError.message);
    }
    return this.getRole(role.id);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    if (id === SUPER_ADMIN_ROLE_ID) {
      throw new ForbiddenException('Cannot modify Super Admin role');
    }
    const existing = await this.getRole(id);
    if (existing.is_super_admin) {
      throw new ForbiddenException('Cannot modify Super Admin role');
    }

    if (dto.name !== undefined) {
      const { error } = await this.supabase
        .from('admin_roles')
        .update({ name: dto.name.trim() })
        .eq('id', id);
      if (error) throw new BadRequestException(error.message);
    }
    if (dto.is_super_admin !== undefined && dto.is_super_admin === true) {
      throw new BadRequestException('Cannot set is_super_admin to true');
    }
    if (dto.permission_ids !== undefined) {
      await this.supabase.from('role_permissions').delete().eq('role_id', id);
      if (dto.permission_ids.length > 0) {
        const rows = dto.permission_ids.map((permission_id) => ({
          role_id: id,
          permission_id,
        }));
        const { error } = await this.supabase.from('role_permissions').insert(rows);
        if (error) throw new BadRequestException(error.message);
      }
    }
    return this.getRole(id);
  }

  async deleteRole(id: string) {
    if (id === SUPER_ADMIN_ROLE_ID) {
      throw new ForbiddenException('Cannot delete Super Admin role');
    }
    const existing = await this.getRole(id);
    if (existing.is_super_admin) {
      throw new ForbiddenException('Cannot delete Super Admin role');
    }
    const { error } = await this.supabase.from('admin_roles').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Role deleted' };
  }

  async getPermissions() {
    const { data, error } = await this.supabase
      .from('admin_permissions')
      .select('id, key, label, permission_group, display_order')
      .order('display_order')
      .order('permission_group');
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getAdminUsers() {
    const { data: admins, error: adminsError } = await this.supabase
      .from('admins')
      .select('id, email, role_id, created_at')
      .order('email');
    if (adminsError) throw new BadRequestException(adminsError.message);

    const roleIds = [...new Set((admins ?? []).map((a: { role_id: string | null }) => a.role_id).filter(Boolean))];
    let rolesMap: Record<string, { id: string; name: string; is_super_admin: boolean }> = {};
    if (roleIds.length > 0) {
      const { data: roles } = await this.supabase
        .from('admin_roles')
        .select('id, name, is_super_admin')
        .in('id', roleIds);
      rolesMap = (roles ?? []).reduce(
        (acc, r) => {
          acc[r.id] = r;
          return acc;
        },
        {} as Record<string, { id: string; name: string; is_super_admin: boolean }>,
      );
    }

    return (admins ?? []).map((a: { id: string; email: string; role_id: string | null; created_at: string }) => ({
      id: a.id,
      email: a.email,
      role_id: a.role_id,
      role_name: a.role_id ? rolesMap[a.role_id]?.name ?? null : null,
      is_super_admin: a.role_id ? rolesMap[a.role_id]?.is_super_admin ?? false : false,
      created_at: a.created_at,
    }));
  }

  async setAdminRole(adminId: string, roleId: string) {
    const { data: admin, error: adminError } = await this.supabase
      .from('admins')
      .select('id, role_id')
      .eq('id', adminId)
      .single();
    if (adminError || !admin) throw new NotFoundException('Admin not found');

    if (admin.role_id === SUPER_ADMIN_ROLE_ID) {
      throw new ForbiddenException('Cannot change role of Super Admin user');
    }

    const { data: role, error: roleError } = await this.supabase
      .from('admin_roles')
      .select('id, is_super_admin')
      .eq('id', roleId)
      .single();
    if (roleError || !role) throw new NotFoundException('Role not found');
    if (role.is_super_admin) {
      throw new BadRequestException('Cannot assign Super Admin role to a user via this endpoint');
    }

    const { error: updateError } = await this.supabase
      .from('admins')
      .update({ role_id: roleId })
      .eq('id', adminId);
    if (updateError) throw new BadRequestException(updateError.message);
    return this.getAdminUsers().then((users) => users.find((u) => u.id === adminId));
  }

  /** Check if an admin user is the protected Super Admin (cannot delete or change role). */
  async isProtectedSuperAdmin(adminId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('admins')
      .select('role_id')
      .eq('id', adminId)
      .single();
    return data?.role_id === SUPER_ADMIN_ROLE_ID;
  }

  /**
   * Create admin credentials: creates a Supabase Auth user and an admins row with the given role.
   * The new admin can log in with the provided email and password.
   */
  async createAdminCredentials(dto: CreateAdminCredentialsDto) {
    const email = dto.email.trim().toLowerCase();
    const { data: role, error: roleError } = await this.supabase
      .from('admin_roles')
      .select('id, name, is_super_admin')
      .eq('id', dto.role_id)
      .single();
    if (roleError || !role) throw new NotFoundException('Role not found');

    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      password: dto.password,
      email_confirm: true,
    });

    if (authError) {
      if (
        authError.message?.toLowerCase().includes('already') ||
        authError.message?.toLowerCase().includes('registered')
      ) {
        throw new BadRequestException('An admin with this email already exists');
      }
      throw new BadRequestException(authError.message || 'Failed to create credentials');
    }

    if (!authData.user) throw new BadRequestException('Failed to create user');

    const { error: insertError } = await this.supabase.from('admins').insert({
      id: authData.user.id,
      email: authData.user.email!,
      role_id: dto.role_id,
    });

    if (insertError) {
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(insertError.message || 'Failed to assign admin role');
    }

    return this.getAdminUsers().then((users) => users.find((u) => u.id === authData.user!.id));
  }

  /**
   * Delete admin credentials: removes the admin from the admins table and deletes the Auth user
   * so they can no longer log in.
   */
  async deleteAdminCredentials(adminId: string) {
    const { data: admin, error: adminError } = await this.supabase
      .from('admins')
      .select('id, role_id')
      .eq('id', adminId)
      .single();
    if (adminError || !admin) throw new NotFoundException('Admin not found');

    if (admin.role_id === SUPER_ADMIN_ROLE_ID) {
      const { count } = await this.supabase
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', SUPER_ADMIN_ROLE_ID);
      if (count !== null && count <= 1) {
        throw new ForbiddenException('Cannot delete the last Super Admin');
      }
    }

    const { error: deleteError } = await this.supabase.auth.admin.deleteUser(adminId);
    if (deleteError) {
      throw new BadRequestException(deleteError.message || 'Failed to revoke login');
    }
    return { message: 'Admin credentials deleted; they can no longer log in.' };
  }
}
