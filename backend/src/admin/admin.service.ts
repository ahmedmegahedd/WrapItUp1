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
}
