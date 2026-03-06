import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CollectionsModule } from './collections/collections.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AddonsModule } from './addons/addons.module';
import { HomepageModule } from './homepage/homepage.module';
import { MailModule } from './mail/mail.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { DeliveryDestinationsModule } from './delivery-destinations/delivery-destinations.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InventoryModule } from './inventory/inventory.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    MailModule,
    ProductsModule,
    CollectionsModule,
    OrdersModule,
    AdminModule,
    PaymentsModule,
    DeliveryModule,
    DeliveryDestinationsModule,
    PromoCodesModule,
    AnalyticsModule,
    AddonsModule,
    HomepageModule,
    LoyaltyModule,
    NotificationsModule,
    InventoryModule,
    CollaboratorsModule,
  ],
})
export class AppModule {}
