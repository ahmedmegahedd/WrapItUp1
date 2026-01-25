import { Controller, Get, Param } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('time-slots')
  getTimeSlots() {
    return this.deliveryService.getTimeSlots();
  }

  @Get('disabled-dates')
  getDisabledDates() {
    return this.deliveryService.getDisabledDates();
  }

  @Get('check-availability/:date')
  async checkAvailability(@Param('date') date: string) {
    const isAvailable = await this.deliveryService.isDateAvailable(date);
    return { date, isAvailable };
  }
}
