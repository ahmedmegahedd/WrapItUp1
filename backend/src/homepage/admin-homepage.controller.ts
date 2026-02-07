import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HomepageService } from './homepage.service';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('admin/homepage')
@UseGuards(AdminGuard)
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
}
