import { Module, forwardRef } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';

@Module({
  imports: [SupabaseModule, forwardRef(() => AdminModule)],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService, AdminGuard],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule {}
