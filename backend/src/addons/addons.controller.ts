import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AddonsService } from './addons.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('addons')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.addonsService.findAll(includeInactive === 'true');
  }

  @Get('product/:productId')
  findByProductId(@Param('productId') productId: string) {
    return this.addonsService.findByProductId(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addonsService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createAddonDto: CreateAddonDto) {
    return this.addonsService.create(createAddonDto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateAddonDto: UpdateAddonDto) {
    return this.addonsService.update(id, updateAddonDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.addonsService.remove(id);
  }
}
