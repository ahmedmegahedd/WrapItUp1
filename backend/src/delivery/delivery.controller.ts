import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CreateDeliveryDayDto } from './dto/create-delivery-day.dto';
import { UpdateDeliveryDayDto } from './dto/update-delivery-day.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { BulkUpdateDeliveryDaysDto } from './dto/bulk-update-delivery-days.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ========== CUSTOMER-FACING ENDPOINTS ==========

  @Get('time-slots')
  getTimeSlots() {
    return this.deliveryService.getTimeSlots();
  }

  @Get('available-dates')
  getAvailableDates(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.deliveryService.getAvailableDates(startDate, endDate);
  }

  @Get('check-availability/:date')
  async checkAvailability(@Param('date') date: string) {
    const availability = await this.deliveryService.getDateAvailability(date);
    return availability;
  }

  // ========== ADMIN ENDPOINTS - DELIVERY DAYS ==========

  @Get('admin/delivery-days')
  @UseGuards(AdminGuard)
  getAllDeliveryDays(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.deliveryService.getAllDeliveryDays(startDate, endDate);
  }

  @Get('admin/delivery-days/:id')
  @UseGuards(AdminGuard)
  getDeliveryDay(@Param('id') id: string) {
    return this.deliveryService.getDeliveryDay(id);
  }

  @Post('admin/delivery-days')
  @UseGuards(AdminGuard)
  createDeliveryDay(@Body() dto: CreateDeliveryDayDto) {
    return this.deliveryService.createDeliveryDay(dto);
  }

  @Put('admin/delivery-days/:id')
  @UseGuards(AdminGuard)
  updateDeliveryDay(@Param('id') id: string, @Body() dto: UpdateDeliveryDayDto) {
    return this.deliveryService.updateDeliveryDay(id, dto);
  }

  @Put('admin/delivery-days/date/:date')
  @UseGuards(AdminGuard)
  updateDeliveryDayByDate(@Param('date') date: string, @Body() dto: UpdateDeliveryDayDto) {
    return this.deliveryService.updateDeliveryDayByDate(date, dto);
  }

  @Post('admin/delivery-days/bulk')
  @UseGuards(AdminGuard)
  bulkUpdateDeliveryDays(@Body() dto: BulkUpdateDeliveryDaysDto) {
    return this.deliveryService.bulkUpdateDeliveryDays(dto);
  }

  @Delete('admin/delivery-days/:id')
  @UseGuards(AdminGuard)
  deleteDeliveryDay(@Param('id') id: string) {
    return this.deliveryService.deleteDeliveryDay(id);
  }

  @Post('admin/delivery-days/reset')
  @UseGuards(AdminGuard)
  resetAllDeliveryDays() {
    return this.deliveryService.resetAllDeliveryDays();
  }

  // ========== ADMIN ENDPOINTS - TIME SLOTS ==========

  @Get('admin/time-slots')
  @UseGuards(AdminGuard)
  getAllTimeSlots() {
    return this.deliveryService.getAllTimeSlots();
  }

  @Get('admin/time-slots/:id')
  @UseGuards(AdminGuard)
  getTimeSlot(@Param('id') id: string) {
    return this.deliveryService.getTimeSlot(id);
  }

  @Post('admin/time-slots')
  @UseGuards(AdminGuard)
  createTimeSlot(@Body() dto: CreateTimeSlotDto) {
    return this.deliveryService.createTimeSlot(dto);
  }

  @Put('admin/time-slots/:id')
  @UseGuards(AdminGuard)
  updateTimeSlot(@Param('id') id: string, @Body() dto: UpdateTimeSlotDto) {
    return this.deliveryService.updateTimeSlot(id, dto);
  }

  @Delete('admin/time-slots/:id')
  @UseGuards(AdminGuard)
  deleteTimeSlot(@Param('id') id: string) {
    return this.deliveryService.deleteTimeSlot(id);
  }

  @Post('admin/time-slots/reorder')
  @UseGuards(AdminGuard)
  reorderTimeSlots(@Body() body: { slotIds: string[] }) {
    return this.deliveryService.reorderTimeSlots(body.slotIds);
  }
}
