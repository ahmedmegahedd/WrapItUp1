import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUsersService } from './admin-users.service';
import { AdminRolesService } from './admin-roles.service';
import { DashboardService } from './dashboard.service';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';
import { CollectionsModule } from '../collections/collections.module';
import { OrdersModule } from '../orders/orders.module';
import { DeliveryDestinationsModule } from '../delivery-destinations/delivery-destinations.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailModule } from '../mail/mail.module';
import { CollaboratorsModule } from '../collaborators/collaborators.module';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    SupabaseModule,
    forwardRef(() => ProductsModule),
    CollectionsModule,
    forwardRef(() => OrdersModule),
    DeliveryDestinationsModule,
    LoyaltyModule,
    MailModule,
    forwardRef(() => CollaboratorsModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminUsersService, AdminRolesService, DashboardService, PermissionGuard],
  exports: [AdminService, PermissionGuard],
})
export class AdminModule {}
