import { Controller, Post, Body, UseGuards, Get, Request, Param, Query, Patch, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';
import { AdminGuard } from './guards/admin.guard';
import { ProductsService } from '../products/products.service';
import { CollectionsService } from '../collections/collections.service';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { CreateCollectionDto } from '../collections/dto/create-collection.dto';
import { UpdateCollectionDto } from '../collections/dto/update-collection.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productsService: ProductsService,
    private readonly collectionsService: CollectionsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('auth/login')
  login(@Body() loginDto: LoginDto) {
    return this.adminService.login(loginDto);
  }

  @Get('auth/me')
  @UseGuards(AdminGuard)
  getMe(@Request() req) {
    return { user: req.user };
  }

  // Products management
  @Post('products')
  @UseGuards(AdminGuard)
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('products')
  @UseGuards(AdminGuard)
  findAllProducts() {
    return this.productsService.findAll(true);
  }

  @Get('products/:id')
  @UseGuards(AdminGuard)
  findOneProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('products/:id')
  @UseGuards(AdminGuard)
  updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete('products/:id')
  @UseGuards(AdminGuard)
  removeProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Collections management
  @Post('collections')
  @UseGuards(AdminGuard)
  createCollection(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get('collections')
  @UseGuards(AdminGuard)
  findAllCollections() {
    return this.collectionsService.findAll(true);
  }

  @Get('collections/:id')
  @UseGuards(AdminGuard)
  findOneCollection(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Patch('collections/:id')
  @UseGuards(AdminGuard)
  updateCollection(@Param('id') id: string, @Body() updateCollectionDto: UpdateCollectionDto) {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete('collections/:id')
  @UseGuards(AdminGuard)
  removeCollection(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }

  // Orders management
  @Get('orders')
  @UseGuards(AdminGuard)
  findAllOrders(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('deliveryDate') deliveryDate?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll({
      status,
      paymentStatus,
      deliveryDate,
      startDate,
      endDate,
    });
  }

  @Get('orders/:id')
  @UseGuards(AdminGuard)
  findOneOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch('orders/:id/status')
  @UseGuards(AdminGuard)
  updateOrderStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
