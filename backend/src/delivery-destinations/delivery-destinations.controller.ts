import { Controller, Get } from '@nestjs/common';
import { DeliveryDestinationsService } from './delivery-destinations.service';

@Controller('delivery-destinations')
export class DeliveryDestinationsController {
  constructor(private readonly service: DeliveryDestinationsService) {}

  @Get()
  findAllActive() {
    return this.service.findAllActive();
  }
}
