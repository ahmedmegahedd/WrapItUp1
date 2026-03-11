import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RestockMaterialDto } from './dto/restock-material.dto';
import { SetProductRecipeDto } from './dto/set-product-recipe.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const VALID_UNITS = ['unit', 'kg', 'g', 'm', 'cm', 'L', 'ml'] as const;

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

function computeStockStatus(
  stockQuantity: number,
  lowThreshold: number | null | undefined,
): StockStatus {
  if (stockQuantity <= 0) return 'out_of_stock';
  if (lowThreshold != null && stockQuantity <= lowThreshold) return 'low_stock';
  return 'in_stock';
}

@Injectable()
export class InventoryService {
  constructor(private supabaseService: SupabaseService) {}

  async getAllMaterials(): Promise<
    Array<{
      id: string;
      name: string;
      name_ar: string | null;
      unit: string;
      stock_quantity: number;
      low_stock_threshold: number | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      stock_status: StockStatus;
    }>
  > {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('materials')
      .select('*, material_categories(id, name, name_ar, color, icon)')
      .order('name');
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).map((row: any) => {
      const stock = Number(row.stock_quantity ?? 0);
      const threshold =
        row.low_stock_threshold != null ? Number(row.low_stock_threshold) : null;
      return {
        ...row,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        stock_status: computeStockStatus(stock, threshold),
      };
    });
    return rows;
  }

  async getMaterialById(id: string): Promise<{
    id: string;
    name: string;
    name_ar: string | null;
    unit: string;
    stock_quantity: number;
    low_stock_threshold: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    stock_status: StockStatus;
    transactions: any[];
  }> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: material, error: matError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();
    if (matError || !material) throw new NotFoundException('Material not found');
    const stock = Number(material.stock_quantity ?? 0);
    const threshold =
      material.low_stock_threshold != null
        ? Number(material.low_stock_threshold)
        : null;

    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('material_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      ...material,
      stock_quantity: stock,
      low_stock_threshold: threshold,
      stock_status: computeStockStatus(stock, threshold),
      transactions: transactions ?? [],
    };
  }

  async createMaterial(dto: CreateMaterialDto) {
    const supabase = this.supabaseService.getAdminClient();
    if (!VALID_UNITS.includes(dto.unit as any)) {
      throw new BadRequestException('Invalid unit');
    }
    const insert: Record<string, unknown> = {
      name: dto.name.trim(),
      unit: dto.unit,
      stock_quantity: dto.stock_quantity ?? 0,
    };
    if (dto.name_ar != null) insert.name_ar = dto.name_ar.trim() || null;
    if (dto.low_stock_threshold != null)
      insert.low_stock_threshold = dto.low_stock_threshold;
    if (dto.notes != null) insert.notes = dto.notes.trim() || null;
    insert.category_id = dto.category_id ?? null;

    const { data: material, error } = await supabase
      .from('materials')
      .insert(insert)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    const initialQty = Number(material.stock_quantity ?? 0);
    if (initialQty > 0) {
      await this.logTransaction(supabase, {
        material_id: material.id,
        order_id: null,
        type: 'restock',
        quantity_change: initialQty,
        quantity_before: 0,
        quantity_after: initialQty,
        note: 'Initial stock',
      });
    }
    return this.getMaterialById(material.id);
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    const supabase = this.supabaseService.getAdminClient();
    const existing = await this.getMaterialById(id);
    const beforeStock = existing.stock_quantity;

    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.name_ar !== undefined) update.name_ar = dto.name_ar?.trim() || null;
    if (dto.unit !== undefined) {
      if (!VALID_UNITS.includes(dto.unit as any))
        throw new BadRequestException('Invalid unit');
      update.unit = dto.unit;
    }
    if (dto.stock_quantity !== undefined) update.stock_quantity = dto.stock_quantity;
    if (dto.low_stock_threshold !== undefined)
      update.low_stock_threshold = dto.low_stock_threshold;
    if (dto.notes !== undefined) update.notes = dto.notes?.trim() || null;
    if (dto.category_id !== undefined) update.category_id = dto.category_id ?? null;
    update.updated_at = new Date().toISOString();

    const { data: material, error } = await supabase
      .from('materials')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    const afterStock = Number(material.stock_quantity ?? 0);
    if (afterStock !== beforeStock) {
      await this.logTransaction(supabase, {
        material_id: id,
        order_id: null,
        type: 'adjustment',
        quantity_change: afterStock - beforeStock,
        quantity_before: beforeStock,
        quantity_after: afterStock,
        note: 'Stock adjustment',
      });
    }
    return this.getMaterialById(id);
  }

  async restockMaterial(id: string, dto: RestockMaterialDto) {
    const supabase = this.supabaseService.getAdminClient();
    const material = await this.getMaterialById(id);
    const beforeStock = material.stock_quantity;
    const change = Number(dto.quantity);
    const afterStock = beforeStock + change;

    const { error: updateError } = await supabase
      .from('materials')
      .update({
        stock_quantity: afterStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateError) throw new BadRequestException(updateError.message);

    await this.logTransaction(supabase, {
      material_id: id,
      order_id: null,
      type: 'restock',
      quantity_change: change,
      quantity_before: beforeStock,
      quantity_after: afterStock,
      note: dto.note?.trim() || null,
    });
    return this.getMaterialById(id);
  }

  async removeMaterial(id: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: inUse } = await supabase
      .from('product_materials')
      .select('id')
      .eq('material_id', id)
      .limit(1);
    if (inUse && inUse.length > 0) {
      throw new BadRequestException(
        'Cannot delete material: it is used in at least one product recipe.',
      );
    }
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
  }

  async getProductRecipe(productId: string): Promise<
    Array<{
      id: string;
      product_id: string;
      material_id: string;
      quantity: number;
      material: {
        id: string;
        name: string;
        name_ar: string | null;
        unit: string;
        stock_quantity: number;
        low_stock_threshold: number | null;
        stock_status: StockStatus;
      };
    }>
  > {
    const supabase = this.supabaseService.getAdminClient();
    const { data: rows, error } = await supabase
      .from('product_materials')
      .select(
        `
        id,
        product_id,
        material_id,
        quantity,
        materials (
          id,
          name,
          name_ar,
          unit,
          stock_quantity,
          low_stock_threshold
        )
      `,
      )
      .eq('product_id', productId);
    if (error) throw new BadRequestException(error.message);
    return (rows ?? []).map((row: any) => {
      const mat = row.materials;
      const stock = Number(mat?.stock_quantity ?? 0);
      const threshold =
        mat?.low_stock_threshold != null ? Number(mat.low_stock_threshold) : null;
      return {
        id: row.id,
        product_id: row.product_id,
        material_id: row.material_id,
        quantity: Number(row.quantity),
        material: mat
          ? {
              ...mat,
              stock_quantity: stock,
              low_stock_threshold: threshold,
              stock_status: computeStockStatus(stock, threshold),
            }
          : null,
      };
    });
  }

  async setProductRecipe(productId: string, dto: SetProductRecipeDto) {
    const supabase = this.supabaseService.getAdminClient();
    const materialIds = (dto.materials ?? []).map((m) => m.materialId);
    if (materialIds.length > 0) {
      const { data: existing } = await supabase
        .from('materials')
        .select('id')
        .in('id', materialIds);
      const foundIds = new Set((existing ?? []).map((r: any) => r.id));
      for (const mid of materialIds) {
        if (!foundIds.has(mid)) {
          throw new BadRequestException(`Material ${mid} not found`);
        }
      }
    }

    await supabase.from('product_materials').delete().eq('product_id', productId);

    if (dto.materials && dto.materials.length > 0) {
      const insertRows = dto.materials.map((m) => ({
        product_id: productId,
        material_id: m.materialId,
        quantity: m.quantity,
      }));
      const { error } = await supabase.from('product_materials').insert(insertRows);
      if (error) throw new BadRequestException(error.message);
    }
    return this.getProductRecipe(productId);
  }

  async deductInventoryForOrder(
    orderId: string,
    orderItems: Array<{ productId: string; quantity: number }>,
  ): Promise<{ lowStockAfter: Array<{ materialId: string; name: string }> }> {
    const supabase = this.supabaseService.getAdminClient();
    const materialDeductions: Record<string, number> = {};

    for (const item of orderItems) {
      const recipe = await this.getProductRecipe(item.productId);
      if (!recipe || recipe.length === 0) continue;
      for (const pm of recipe) {
        const key = pm.material_id;
        const need = Number(pm.quantity) * item.quantity;
        materialDeductions[key] = (materialDeductions[key] ?? 0) + need;
      }
    }

    const lowStockAfter: Array<{ materialId: string; name: string }> = [];

    for (const [materialId, amount] of Object.entries(materialDeductions)) {
      const { data: material } = await supabase
        .from('materials')
        .select('id, name, stock_quantity, low_stock_threshold')
        .eq('id', materialId)
        .single();
      if (!material) continue;
      const before = Number(material.stock_quantity ?? 0);
      const after = before - amount;

      await supabase
        .from('materials')
        .update({
          stock_quantity: after,
          updated_at: new Date().toISOString(),
        })
        .eq('id', materialId);

      await this.logTransaction(supabase, {
        material_id: materialId,
        order_id: orderId,
        type: 'deduction',
        quantity_change: -amount,
        quantity_before: before,
        quantity_after: after,
        note: `Order ${orderId}`,
      });

      const threshold =
        material.low_stock_threshold != null
          ? Number(material.low_stock_threshold)
          : null;
      if (threshold != null && after <= threshold) {
        lowStockAfter.push({ materialId, name: material.name });
      }
    }
    return { lowStockAfter };
  }

  async refundInventoryForOrder(orderId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: deductions } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('type', 'deduction');
    if (!deductions || deductions.length === 0) return;

    for (const tx of deductions) {
      // Read current stock fresh from DB — don't use stale tx.quantity_after
      const { data: material } = await supabase
        .from('materials')
        .select('stock_quantity, name')
        .eq('id', tx.material_id)
        .single();
      if (!material) {
        console.warn(`[Inventory] Material ${tx.material_id} not found for refund`);
        continue;
      }

      const before = Number(material.stock_quantity ?? 0);
      const change = Math.abs(Number(tx.quantity_change));
      const after = before + change;

      await supabase
        .from('materials')
        .update({
          stock_quantity: after,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tx.material_id);

      await this.logTransaction(supabase, {
        material_id: tx.material_id,
        order_id: orderId,
        type: 'refund',
        quantity_change: change,
        quantity_before: before,
        quantity_after: after,
        note: `Refund for order ${orderId}`,
      });
    }
  }

  async getLowStockMaterials(): Promise<
    Array<{
      id: string;
      name: string;
      name_ar: string | null;
      unit: string;
      stock_quantity: number;
      low_stock_threshold: number | null;
      stock_status: StockStatus;
    }>
  > {
    const all = await this.getAllMaterials();
    return all.filter((m) => m.stock_status === 'low_stock' || m.stock_status === 'out_of_stock');
  }

  async getShoppingList(): Promise<
    Array<{
      materialId: string;
      name: string;
      unit: string;
      currentStock: number;
      threshold: number | null;
      suggestedQuantity: number;
      reason: 'negative' | 'low' | 'demand';
      category_id: string | null;
    }>
  > {
    const supabase = this.supabaseService.getAdminClient();
    const { data: materials } = await supabase
      .from('materials')
      .select('id, name, unit, stock_quantity, low_stock_threshold, category_id');
    const matList = materials ?? [];

    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id, order_items(product_id, quantity)')
      .in('order_status', ['pending', 'preparing']);
    const orders = pendingOrders ?? [];
    const demandByMaterial: Record<string, number> = {};
    for (const order of orders) {
      const items = (order as any).order_items ?? [];
      for (const oi of items) {
        const recipe = await this.getProductRecipe(oi.product_id);
        const qty = Number(oi.quantity ?? 0);
        for (const pm of recipe) {
          const need = Number(pm.quantity) * qty;
          demandByMaterial[pm.material_id] =
            (demandByMaterial[pm.material_id] ?? 0) + need;
        }
      }
    }

    const result: Array<{
      materialId: string;
      name: string;
      unit: string;
      currentStock: number;
      threshold: number | null;
      suggestedQuantity: number;
      reason: 'negative' | 'low' | 'demand';
      category_id: string | null;
    }> = [];

    for (const m of matList) {
      const stock = Number(m.stock_quantity ?? 0);
      const threshold =
        m.low_stock_threshold != null ? Number(m.low_stock_threshold) : null;
      const debt = Math.abs(Math.min(0, stock));
      const gap = Math.max(
        0,
        (threshold ?? 0) - Math.max(0, stock),
      );
      const demand = demandByMaterial[m.id] ?? 0;
      const suggested = debt + gap + demand;
      if (suggested <= 0 && stock >= 0 && (threshold == null || stock > threshold))
        continue;

      let reason: 'negative' | 'low' | 'demand' = 'low';
      if (stock < 0) reason = 'negative';
      else if (demand > 0 && (threshold == null || stock <= threshold))
        reason = demand > gap + debt ? 'demand' : 'low';
      else if (threshold != null && stock <= threshold) reason = 'low';

      result.push({
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        currentStock: stock,
        threshold,
        suggestedQuantity: Math.max(suggested, debt + gap),
        reason,
        category_id: (m as any).category_id ?? null,
      });
    }
    return result;
  }

  async getAllCategories() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async createCategory(dto: CreateCategoryDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: existing } = await supabase
      .from('material_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const maxOrder = (existing?.[0]?.sort_order as number | undefined) ?? 0;
    const { data, error } = await supabase
      .from('material_categories')
      .insert({
        name: dto.name,
        name_ar: dto.name_ar ?? null,
        color: dto.color ?? '#6B7280',
        icon: dto.icon ?? 'cube-outline',
        sort_order: dto.sort_order ?? maxOrder + 1,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const supabase = this.supabaseService.getAdminClient();
    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.name_ar !== undefined) update.name_ar = dto.name_ar ?? null;
    if (dto.color !== undefined) update.color = dto.color;
    if (dto.icon !== undefined) update.icon = dto.icon;
    if (dto.sort_order !== undefined) update.sort_order = dto.sort_order;
    const { data, error } = await supabase
      .from('material_categories')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteCategory(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { count } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    if (count && count > 0) {
      throw new BadRequestException(
        `Cannot delete category: ${count} material(s) are assigned to it. Reassign them first.`,
      );
    }
    const { error } = await supabase
      .from('material_categories')
      .delete()
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true };
  }

  private async logTransaction(
    supabase: any,
    payload: {
      material_id: string;
      order_id: string | null;
      type: 'restock' | 'deduction' | 'refund' | 'adjustment';
      quantity_change: number;
      quantity_before: number;
      quantity_after: number;
      note: string | null;
    },
  ) {
    await supabase.from('inventory_transactions').insert(payload);
  }
}
