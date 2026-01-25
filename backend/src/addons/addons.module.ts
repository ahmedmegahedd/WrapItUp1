import { Module } from '@nestjs/common';
import { AddonsController } from './addons.controller';
import { AddonsService } from './addons.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';
import { AdminGuard } from '../admin/guards/admin.guard';

@Module({
  imports: [SupabaseModule, AdminModule],
  controllers: [AddonsController],
  providers: [AddonsService, AdminGuard],
  exports: [AddonsService],
})
export class AddonsModule {}
