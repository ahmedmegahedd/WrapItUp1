import { Module, forwardRef } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { HomepageController } from './homepage.controller';
import { AdminHomepageController } from './admin-homepage.controller';
import { AdminGuard } from '../admin/guards/admin.guard';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => AdminModule)],
  controllers: [HomepageController, AdminHomepageController],
  providers: [HomepageService, AdminGuard],
  exports: [HomepageService],
})
export class HomepageModule {}
