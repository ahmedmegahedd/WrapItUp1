import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, TimeRange } from './dto/analytics-query.dto';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Public tracking endpoints (no auth required)
  @Post('track/product-click')
  async trackProductClick(@Body() body: { product_id: string; session_id: string }) {
    await this.analyticsService.trackProductClick(body.product_id, body.session_id);
    return { success: true };
  }

  @Post('track/session')
  async trackSession(@Body() body: { session_id: string }) {
    await this.analyticsService.updateUserSession(body.session_id);
    return { success: true };
  }

  // Admin-only endpoints
  @Get('product-clicks')
  @UseGuards(AdminGuard)

  @Get('product-clicks')
  async getProductClicks() {
    return this.analyticsService.getProductClicks();
  }

  @Get('daily-users')
  @UseGuards(AdminGuard)
  async getDailyUsers(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDailyUsers(query.timeRange);
  }

  @Get('live-users')
  @UseGuards(AdminGuard)
  async getLiveUsers(@Query('activeSeconds') activeSeconds?: string) {
    const seconds = activeSeconds ? parseInt(activeSeconds) : 60;
    return this.analyticsService.getLiveUsers(seconds);
  }

  @Get('conversion-counts')
  @UseGuards(AdminGuard)
  async getConversionCounts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getConversionCounts(
      query.timeRange,
      query.startDate,
      query.endDate,
    );
  }

  @Get('best-selling-products')
  @UseGuards(AdminGuard)
  async getBestSellingProducts() {
    return this.analyticsService.getBestSellingProducts();
  }

  @Get('sales-summary')
  @UseGuards(AdminGuard)
  async getSalesSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSalesSummary(
      query.timeRange,
      query.startDate,
      query.endDate,
    );
  }

  @Get('peak-order-hours')
  @UseGuards(AdminGuard)
  async getPeakOrderHours() {
    return this.analyticsService.getPeakOrderHours();
  }
}
