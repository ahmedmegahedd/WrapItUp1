import { Module, forwardRef } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { PromoCodesController } from './promo-codes.controller';
import { AdminGuard } from '../admin/guards/admin.guard';
import { AdminModule } from '../admin/admin.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => AdminModule)],
  controllers: [PromoCodesController],
  providers: [PromoCodesService, AdminGuard],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
