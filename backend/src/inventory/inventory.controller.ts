import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PermissionGuard } from '../admin/guards/permission.guard';
import { RequirePermission } from '../admin/decorators/require-permission.decorator';
import { ADMIN_PERMISSIONS } from '../admin/admin-permissions.const';
import { InventoryService } from './inventory.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RestockMaterialDto } from './dto/restock-material.dto';
import { SetProductRecipeDto } from './dto/set-product-recipe.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin/inventory')
@UseGuards(AdminGuard, PermissionGuard)
@RequirePermission(ADMIN_PERMISSIONS.INVENTORY_VIEW)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getAllMaterials() {
    return this.inventoryService.getAllMaterials();
  }

  @Get('low-stock')
  getLowStockMaterials() {
    return this.inventoryService.getLowStockMaterials();
  }

  @Get('shopping-list')
  getShoppingList() {
    return this.inventoryService.getShoppingList();
  }

  @Get('categories')
  getAllCategories() {
    return this.inventoryService.getAllCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.inventoryService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.inventoryService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(id);
  }

  @Get('product/:productId')
  getProductRecipe(@Param('productId') productId: string) {
    return this.inventoryService.getProductRecipe(productId);
  }

  @Put('product/:productId')
  setProductRecipe(
    @Param('productId') productId: string,
    @Body() dto: SetProductRecipeDto,
  ) {
    return this.inventoryService.setProductRecipe(productId, dto);
  }

  @Get(':id')
  getMaterialById(@Param('id') id: string) {
    return this.inventoryService.getMaterialById(id);
  }

  @Post()
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.inventoryService.createMaterial(dto);
  }

  @Patch(':id')
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.inventoryService.updateMaterial(id, dto);
  }

  @Delete(':id')
  async removeMaterial(@Param('id') id: string) {
    await this.inventoryService.removeMaterial(id);
    return { success: true };
  }

  @Post(':id/restock')
  restockMaterial(
    @Param('id') id: string,
    @Body() dto: RestockMaterialDto,
  ) {
    return this.inventoryService.restockMaterial(id, dto);
  }
}
