import { Controller, Get, Param, Query } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('homepageOnly') homepageOnly?: string,
  ) {
    return this.collectionsService.findAll(
      includeInactive === 'true',
      homepageOnly === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }
}
