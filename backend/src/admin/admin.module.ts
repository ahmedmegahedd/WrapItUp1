import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';
import { CollectionsModule } from '../collections/collections.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ProductsModule, CollectionsModule, OrdersModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
