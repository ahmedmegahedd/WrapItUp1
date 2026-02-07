import { Controller, Get } from '@nestjs/common';
import { HomepageService } from './homepage.service';

@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('active-hero')
  getActiveHero() {
    return this.homepageService.getActiveHeroImage();
  }

  @Get('hero-text')
  getHeroText() {
    return this.homepageService.getHeroText();
  }
}
