import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodeService: PromoCodesService) {}

  /** Public: validate code and get discount amount (for checkout). */
  @Post('validate')
  validate(@Body() dto: ValidatePromoCodeDto) {
    return this.promoCodeService.validateAndGetDiscount(dto.code, dto.subtotal_egp);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.promoCodeService.findAll(true);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.promoCodeService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodeService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(id);
  }
}
