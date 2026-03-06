import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PermissionGuard } from '../admin/guards/permission.guard';
import { RequirePermission } from '../admin/decorators/require-permission.decorator';
import { ADMIN_PERMISSIONS } from '../admin/admin-permissions.const';

@Controller('admin/homepage')
@UseGuards(AdminGuard, PermissionGuard)
@RequirePermission(ADMIN_PERMISSIONS.HOMEPAGE_VIEW)
export class AdminHomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('hero-images')
  listHeroImages() {
    return this.homepageService.listHeroImages();
  }

  @Post('hero-images')
  addHeroImage(@Body() body: { image_url: string; set_as_active?: boolean }) {
    const setAsActive = body.set_as_active ?? false;
    return this.homepageService.addHeroImage(body.image_url, setAsActive);
  }

  @Patch('hero-images/:id/set-active')
  setActive(@Param('id') id: string) {
    return this.homepageService.setActive(id);
  }

  @Delete('hero-images/:id')
  deleteHeroImage(@Param('id') id: string) {
    return this.homepageService.deleteHeroImage(id);
  }

  @Get('hero-text')
  getHeroText() {
    return this.homepageService.getHeroText();
  }

  @Patch('hero-text')
  updateHeroText(@Body() body: { headline?: string; subtext?: string; button_label?: string }) {
    return this.homepageService.updateHeroText(body);
  }

  @Get('app-settings')
  getAppSettings() {
    return this.homepageService.getAppSettings();
  }

  @Patch('app-settings')
  updateAppSettings(
    @Body()
    body: {
      home_section_order?: string[];
      promotion_visible?: boolean;
      promotion_title?: string;
      promotion_message?: string;
      final_cta_headline?: string;
      final_cta_subtext?: string;
      final_cta_button?: string;
      featured_products_limit?: number;
      active_layout?: string;
      marquee_text?: string;
      marquee_active?: boolean;
      todays_pick_product_id?: string | null;
      todays_pick_active?: boolean;
      todays_pick_label?: string;
    },
  ) {
    return this.homepageService.updateAppSettings(body);
  }
}
