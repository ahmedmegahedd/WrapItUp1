import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('showInAllCollection') showInAllCollection?: string,
  ) {
    return this.productsService.findAll(
      includeInactive === 'true',
      showInAllCollection === 'true',
    );
  }

  @Get('recommended/checkout')
  findRecommendedAtCheckout() {
    return this.productsService.findRecommendedAtCheckout(4);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
