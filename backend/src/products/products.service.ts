import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(includeInactive = false, showInAllCollection = false) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_variations(
          *,
          product_variation_options(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
      // Collaborator products: only show when approval_status = 'active'
      query = query.or('collaborator_id.is.null,approval_status.eq.active');
    }
    if (showInAllCollection) {
      query = query.eq('show_in_all_collection', true);
    }

    const { data, error } = await query;

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  /** Admin list: optional collaborator scope and filters. */
  async findAllForAdmin(
    includeInactive: boolean,
    opts?: {
      collaboratorId?: string | null;
      type?: 'wrapitup' | 'collaborator';
      approvalStatus?: string;
    },
  ) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_variations(
          *,
          product_variation_options(*)
        ),
        collaborators(id, brand_name)
      `)
      .order('created_at', { ascending: false });

    if (opts?.collaboratorId) {
      query = query.eq('collaborator_id', opts.collaboratorId);
    } else if (opts?.type === 'wrapitup') {
      query = query.is('collaborator_id', null);
    } else if (opts?.type === 'collaborator') {
      query = query.not('collaborator_id', 'is', null);
    }
    if (opts?.approvalStatus) {
      query = query.eq('approval_status', opts.approvalStatus);
    }
    if (!includeInactive && !opts?.collaboratorId) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Up to 4 products marked as recommended at checkout (for "People also like" in cart). */
  async findRecommendedAtCheckout(limit = 4) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, slug, base_price, discount_price, points_value,
        product_images(image_url, display_order)
      `)
      .eq('is_active', true)
      .eq('recommended_at_checkout', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_variations(
          *,
          product_variation_options(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }
    if (data.collaborator_id && (data.approval_status !== 'active' || !data.is_active)) {
      throw new NotFoundException('Product not found');
    }
    return data;
  }

  /** Admin get one: no approval filter; optional ownership check. */
  async findOneForAdmin(id: string, collaboratorId?: string | null) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_variations(
          *,
          product_variation_options(*)
        ),
        collaborators(id, brand_name, commission_rate)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }
    if (collaboratorId && data.collaborator_id !== collaboratorId) {
      throw new NotFoundException('Product not found');
    }
    return data;
  }

  async findBySlug(slug: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        product_variations(
          *,
          product_variation_options(*)
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Product not found');
    }
    if (data.collaborator_id && data.approval_status !== 'active') {
      throw new NotFoundException('Product not found');
    }
    return data;
  }

  async create(createProductDto: CreateProductDto, collaboratorId?: string | null) {
    const supabase = this.supabaseService.getAdminClient();

    // Generate slug if not provided
    const slug = createProductDto.slug || this.generateSlug(createProductDto.title);

    // Create product
    const pointsValue = createProductDto.points_value ?? 0;
    const minimumQuantity =
      createProductDto.minimum_quantity != null && createProductDto.minimum_quantity >= 1
        ? createProductDto.minimum_quantity
        : null;

    const isCollaboratorProduct = !!collaboratorId;
    const insertPayload: Record<string, unknown> = {
      title: createProductDto.title,
      slug,
      description: createProductDto.description,
      base_price: createProductDto.base_price,
      discount_price: createProductDto.discount_price,
      stock_quantity: createProductDto.stock_quantity,
      points_value: pointsValue,
      is_active: isCollaboratorProduct ? false : (createProductDto.is_active ?? true),
      minimum_quantity: minimumQuantity,
      show_in_all_collection: createProductDto.show_in_all_collection ?? false,
      recommended_at_checkout: createProductDto.recommended_at_checkout ?? false,
      collaborator_id: collaboratorId || null,
      approval_status: isCollaboratorProduct ? 'pending' : 'active',
    };

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (productError) throw new BadRequestException(productError.message);

    // Add images
    if (createProductDto.image_urls && createProductDto.image_urls.length > 0) {
      const images = createProductDto.image_urls.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        display_order: index,
      }));

      await supabase.from('product_images').insert(images);
    }

    // Add variations
    if (createProductDto.variations && createProductDto.variations.length > 0) {
      for (const variation of createProductDto.variations) {
        const { data: variationData } = await supabase
          .from('product_variations')
          .insert({
            product_id: product.id,
            name: variation.name,
            display_order: variation.display_order || 0,
          })
          .select()
          .single();

        if (variationData && variation.options) {
          const options = variation.options.map((opt, index) => ({
            variation_id: variationData.id,
            label: opt.label,
            price_modifier: opt.price_modifier || 0,
            stock_quantity: opt.stock_quantity ?? 0,
            display_order: index,
          }));

          await supabase.from('product_variation_options').insert(options);
        }
      }
    }

    return this.findOne(product.id);
  }

  async update(id: string, updateProductDto: UpdateProductDto, collaboratorId?: string | null) {
    const supabase = this.supabaseService.getAdminClient();

    const existing = await this.findOneForAdmin(id, collaboratorId);

    const updateData: any = {};
    if (updateProductDto.title !== undefined) updateData.title = updateProductDto.title;
    if (updateProductDto.slug !== undefined) updateData.slug = updateProductDto.slug;
    if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
    if (updateProductDto.base_price !== undefined) updateData.base_price = updateProductDto.base_price;
    if (updateProductDto.discount_price !== undefined) updateData.discount_price = updateProductDto.discount_price;
    if (updateProductDto.stock_quantity !== undefined) updateData.stock_quantity = updateProductDto.stock_quantity;
    if (updateProductDto.points_value !== undefined) updateData.points_value = updateProductDto.points_value;
    if (!collaboratorId && updateProductDto.is_active !== undefined) updateData.is_active = updateProductDto.is_active;
    if (collaboratorId && existing.approval_status === 'rejected') {
      updateData.approval_status = 'pending';
      updateData.product_rejection_reason = null;
    }
    // minimum_quantity: undefined = don't change; null or number = update (null clears minimum)
    if (updateProductDto.minimum_quantity !== undefined) {
      updateData.minimum_quantity =
        updateProductDto.minimum_quantity != null && updateProductDto.minimum_quantity >= 1
          ? updateProductDto.minimum_quantity
          : null;
    }
    if (updateProductDto.show_in_all_collection !== undefined) {
      updateData.show_in_all_collection = updateProductDto.show_in_all_collection;
    }
    if (updateProductDto.recommended_at_checkout !== undefined) {
      updateData.recommended_at_checkout = updateProductDto.recommended_at_checkout;
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    // Update images if provided
    if (updateProductDto.image_urls) {
      // Delete existing images
      await supabase.from('product_images').delete().eq('product_id', id);

      // Insert new images
      if (updateProductDto.image_urls.length > 0) {
        const images = updateProductDto.image_urls.map((url, index) => ({
          product_id: id,
          image_url: url,
          display_order: index,
        }));
        await supabase.from('product_images').insert(images);
      }
    }

    // Update variations if provided
    if (updateProductDto.variations) {
      // Delete existing variations (cascade will delete options)
      await supabase.from('product_variations').delete().eq('product_id', id);

      // Insert new variations
      for (const variation of updateProductDto.variations) {
        const { data: variationData } = await supabase
          .from('product_variations')
          .insert({
            product_id: id,
            name: variation.name,
            display_order: variation.display_order || 0,
          })
          .select()
          .single();

        if (variationData && variation.options) {
          const options = variation.options.map((opt, index) => ({
            variation_id: variationData.id,
            label: opt.label,
            price_modifier: opt.price_modifier || 0,
            stock_quantity: opt.stock_quantity ?? 0,
            display_order: index,
          }));
          await supabase.from('product_variation_options').insert(options);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, collaboratorId?: string | null) {
    const supabase = this.supabaseService.getAdminClient();
    const existing = await this.findOneForAdmin(id, collaboratorId);
    if (collaboratorId) {
      if (existing.collaborator_id !== collaboratorId) {
        throw new NotFoundException('Product not found');
      }
      const status = existing.approval_status;
      if (status !== 'pending' && status !== 'rejected') {
        throw new BadRequestException('You can only delete products that are pending or rejected');
      }
    }
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Product deleted successfully' };
  }

  async setApprovalStatus(
    id: string,
    status: 'approved' | 'active' | 'rejected',
    reason?: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, collaborator_id, approval_status')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      throw new NotFoundException('Product not found');
    }
    if (!existing.collaborator_id) {
      throw new BadRequestException('Only collaborator products can be approved or rejected');
    }
    const update: any = { approval_status: status };
    if (status === 'rejected') {
      update.is_active = false;
      update.product_rejection_reason = reason?.trim() || null;
    } else if (status === 'active') {
      if (existing.approval_status !== 'approved') {
        throw new BadRequestException('Product must be approved before activation');
      }
      update.is_active = true;
    }
    const { error } = await supabase.from('products').update(update).eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return this.findOneForAdmin(id);
  }

  /** Super admin only: set collaborator product back to pending (re-review). */
  async setApprovalPending(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: existing } = await supabase.from('products').select('id, collaborator_id').eq('id', id).single();
    if (!existing?.collaborator_id) throw new BadRequestException('Only collaborator products can be set to pending');
    const { error } = await supabase.from('products').update({ approval_status: 'pending', product_rejection_reason: null }).eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return this.findOneForAdmin(id);
  }

  async decreaseStock(productId: string, quantity: number) {
    const supabase = this.supabaseService.getAdminClient();
    const product = await this.findOne(productId);
    if (product.stock_quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', productId);
    if (error) throw new BadRequestException(error.message);
  }

  /** Check if product/variation has enough stock. Throws if not. */
  async checkStockForOrderItem(
    productId: string,
    quantity: number,
    selectedVariationOptionIds?: Record<string, string>,
  ): Promise<void> {
    const product = await this.findOne(productId);
    const supabase = this.supabaseService.getAdminClient();

    if (selectedVariationOptionIds && Object.keys(selectedVariationOptionIds).length > 0) {
      const optionIds = Object.values(selectedVariationOptionIds);
      for (const optionId of optionIds) {
        const { data: option, error } = await supabase
          .from('product_variation_options')
          .select('id, stock_quantity')
          .eq('id', optionId)
          .single();
        if (!error && option && (option.stock_quantity ?? 0) < quantity) {
          throw new BadRequestException(`Insufficient stock for selected option`);
        }
      }
      return;
    }
    if ((product.stock_quantity ?? 0) < quantity) {
      throw new BadRequestException(`Insufficient stock for ${product.title}`);
    }
  }

  /** Decrease stock after payment success. Uses variation option stock if selected_variation_option_ids provided. */
  async decreaseStockForOrderItem(
    productId: string,
    quantity: number,
    selectedVariationOptionIds?: Record<string, string> | null,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    if (selectedVariationOptionIds && Object.keys(selectedVariationOptionIds).length > 0) {
      const optionIds = Object.values(selectedVariationOptionIds);
      for (const optionId of optionIds) {
        const { data: option } = await supabase
          .from('product_variation_options')
          .select('id, stock_quantity')
          .eq('id', optionId)
          .single();
        if (option != null) {
          const current = option.stock_quantity ?? 0;
          await supabase
            .from('product_variation_options')
            .update({ stock_quantity: Math.max(0, current - quantity) })
            .eq('id', optionId);
        }
      }
      return;
    }
    await this.decreaseStock(productId, quantity);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
