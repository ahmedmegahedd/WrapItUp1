import { Module } from '@nestjs/common';
import { DeliveryDestinationsService } from './delivery-destinations.service';
import { DeliveryDestinationsController } from './delivery-destinations.controller';

@Module({
  controllers: [DeliveryDestinationsController],
  providers: [DeliveryDestinationsService],
  exports: [DeliveryDestinationsService],
})
export class DeliveryDestinationsModule {}
