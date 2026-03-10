import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Validates a Supabase JWT token from the Authorization header.
 * Populates request.user with { id, email } for the authenticated customer.
 * Used on customer-facing endpoints (e.g. GET /orders/my-orders).
 */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    const supabase = this.supabaseService.getClient();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = {
      id: user.id,
      email: user.email,
    };

    return true;
  }
}
