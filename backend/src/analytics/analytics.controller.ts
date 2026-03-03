import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PermissionGuard } from '../admin/guards/permission.guard';
import { RequirePermission } from '../admin/decorators/require-permission.decorator';
import { ADMIN_PERMISSIONS } from '../admin/admin-permissions.const';

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
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getProductClicks() {
    return this.analyticsService.getProductClicks();
  }

  @Get('daily-users')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getDailyUsers(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDailyUsers(query.timeRange);
  }

  @Get('live-users')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getLiveUsers(@Query('activeSeconds') activeSeconds?: string) {
    const seconds = activeSeconds ? parseInt(activeSeconds) : 60;
    return this.analyticsService.getLiveUsers(seconds);
  }

  @Get('conversion-counts')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getConversionCounts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getConversionCounts(
      query.timeRange,
      query.startDate,
      query.endDate,
    );
  }

  @Get('best-selling-products')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getBestSellingProducts() {
    return this.analyticsService.getBestSellingProducts();
  }

  @Get('sales-summary')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getSalesSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSalesSummary(
      query.timeRange,
      query.startDate,
      query.endDate,
    );
  }

  @Get('peak-order-hours')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getPeakOrderHours() {
    return this.analyticsService.getPeakOrderHours();
  }

  // ----- Customer analytics (do not break existing endpoints above) -----

  @Post('track/start-checkout')
  async trackStartCheckout(@Body() body: { user_id?: string; cart_value: number }) {
    const cartValue = Number(body?.cart_value) || 0;
    await this.analyticsService.trackStartCheckout(body?.user_id ?? null, cartValue);
    return { success: true };
  }

  @Get('repeat-customer-rate')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getRepeatCustomerRate() {
    return this.analyticsService.getRepeatCustomerRate();
  }

  @Get('customer-lifetime-value')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getCustomerLifetimeValue() {
    return this.analyticsService.getCustomerLifetimeValue();
  }

  @Get('top-customers')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getTopCustomers(
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const sortBy = sort === 'orders' ? 'orders' : 'revenue';
    return this.analyticsService.getTopCustomers(limitNum, sortBy);
  }

  @Get('retention')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getRetention(@Query('days') days?: string) {
    const daysNum = days === '60' ? 60 : 30;
    return this.analyticsService.getRetention(daysNum);
  }

  @Get('abandoned-checkout')
  @UseGuards(AdminGuard, PermissionGuard)
  @RequirePermission(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
  async getAbandonedCheckout() {
    return this.analyticsService.getAbandonedCheckout();
  }
}
