import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';

/** In-memory OTP store for dev placeholder. Replace with Redis/DB for production. */
interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private otpStore = new Map<string, OtpRecord>();

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  /**
   * Register a new user. Phone is required and stored in E.164 for later OTP login.
   * Profile is created so OTP auth can look up user by phone.
   */
  async register(dto: RegisterDto): Promise<{ success: true }> {
    const phone = dto.phone.trim();
    const email = dto.email.trim().toLowerCase();

    const admin = this.supabase.getAdminClient();

    // Enforce one account per phone
    const { data: existingByPhone } = await admin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    let user: { id: string };
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.full_name?.trim() || null,
          phone,
        },
      });
      if (error) {
        if (error.message?.toLowerCase().includes('already') || error.message?.toLowerCase().includes('registered')) {
          throw new ConflictException('Email already registered');
        }
        throw new BadRequestException(error.message || 'Invalid request');
      }
      if (!data?.user) throw new BadRequestException('User creation failed');
      user = { id: data.user.id };
    } catch (e: any) {
      if (e instanceof ConflictException || e instanceof BadRequestException) throw e;
      throw new BadRequestException(e?.message || 'Sign-up failed');
    }

    // Profile is created by DB trigger on auth.users. Ensure profile exists with phone for OTP lookup.
    const { error: profileError } = await admin.from('profiles').upsert(
      { id: user.id, email, full_name: dto.full_name?.trim() || null, phone },
      { onConflict: 'id' }
    );

    if (profileError) {
      if (profileError.code === '23505') {
        throw new ConflictException('Phone number already registered');
      }
      throw new BadRequestException(profileError.message || 'Failed to create profile');
    }

    return { success: true };
  }

  /**
   * Send OTP to phone (placeholder: log in dev only). For production, wire to SMS provider.
   */
  async sendOtp(phone: string): Promise<{ success: true }> {
    const normalized = phone.trim();
    const code = crypto.randomInt(100000, 999999).toString();
    const hash = this.hashOtp(code);
    this.otpStore.set(normalized, {
      hash,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    const isDev = this.config.get('NODE_ENV') !== 'production';
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[OTP dev] phone=*** code=${code} (do not log phone in production)`);
    }
    // TODO: Wire to SMS provider (e.g. Vodafone) – same interface, swap implementation
    await this.sendOtpSms(normalized, code);

    return { success: true };
  }

  /**
   * Verify OTP and return user identity for login. OTP is for login only, not sign-up.
   */
  async verifyOtp(phone: string, code: string): Promise<{ userId: string; email: string }> {
    const normalized = phone.trim();
    const record = this.otpStore.get(normalized);
    if (!record) {
      throw new BadRequestException('Invalid or expired code');
    }
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(normalized);
      throw new BadRequestException('Code expired');
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      this.otpStore.delete(normalized);
      throw new BadRequestException('Too many attempts');
    }
    record.attempts += 1;
    const hash = this.hashOtp(code);
    if (record.hash.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(record.hash, 'hex'), Buffer.from(hash, 'hex'))) {
      throw new BadRequestException('Invalid code');
    }
    this.otpStore.delete(normalized);

    const admin = this.supabase.getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email')
      .eq('phone', normalized)
      .maybeSingle();

    if (error || !profile) {
      throw new BadRequestException('No account found for this phone number');
    }
    return { userId: profile.id, email: profile.email };
  }

  private hashOtp(code: string): string {
    const secret = this.config.get('OTP_SECRET') || 'dev-secret-change-in-production';
    return crypto.createHmac('sha256', secret).update(code).digest('hex');
  }

  /** Abstraction for sending OTP SMS. Replace with real provider (e.g. Vodafone) later. */
  private async sendOtpSms(_phone: string, _code: string): Promise<void> {
    // Placeholder: no-op. In production, call SMS gateway.
  }
}
