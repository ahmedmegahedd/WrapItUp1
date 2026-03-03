import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';
import { AdminGuard } from '../admin/guards/admin.guard';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [SupabaseModule, AdminModule],
  controllers: [InventoryController],
  providers: [InventoryService, AdminGuard],
  exports: [InventoryService],
})
export class InventoryModule {}
