import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';
import { AddonsModule } from '../addons/addons.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryDestinationsModule } from '../delivery-destinations/delivery-destinations.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    ProductsModule,
    AddonsModule,
    SupabaseModule,
    forwardRef(() => DeliveryModule),
    DeliveryDestinationsModule,
    PromoCodesModule,
    LoyaltyModule,
    NotificationsModule,
    AnalyticsModule,
    InventoryModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
