import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';
import { CollectionsModule } from '../collections/collections.module';
import { OrdersModule } from '../orders/orders.module';
import { DeliveryDestinationsModule } from '../delivery-destinations/delivery-destinations.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    ProductsModule,
    CollectionsModule,
    forwardRef(() => OrdersModule),
    DeliveryDestinationsModule,
    LoyaltyModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
