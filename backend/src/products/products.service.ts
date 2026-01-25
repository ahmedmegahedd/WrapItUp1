import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(includeInactive = false) {
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
    }

    const { data, error } = await query;

    if (error) throw new BadRequestException(error.message);

    return data;
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

    return data;
  }

  async create(createProductDto: CreateProductDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Generate slug if not provided
    const slug = createProductDto.slug || this.generateSlug(createProductDto.title);

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title: createProductDto.title,
        slug,
        description: createProductDto.description,
        base_price: createProductDto.base_price,
        discount_price: createProductDto.discount_price,
        sku: createProductDto.sku,
        stock_quantity: createProductDto.stock_quantity,
        is_active: createProductDto.is_active ?? true,
      })
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
            display_order: index,
          }));

          await supabase.from('product_variation_options').insert(options);
        }
      }
    }

    return this.findOne(product.id);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Check if product exists
    await this.findOne(id);

    const updateData: any = {};
    if (updateProductDto.title !== undefined) updateData.title = updateProductDto.title;
    if (updateProductDto.slug !== undefined) updateData.slug = updateProductDto.slug;
    if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
    if (updateProductDto.base_price !== undefined) updateData.base_price = updateProductDto.base_price;
    if (updateProductDto.discount_price !== undefined) updateData.discount_price = updateProductDto.discount_price;
    if (updateProductDto.sku !== undefined) updateData.sku = updateProductDto.sku;
    if (updateProductDto.stock_quantity !== undefined) updateData.stock_quantity = updateProductDto.stock_quantity;
    if (updateProductDto.is_active !== undefined) updateData.is_active = updateProductDto.is_active;

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
            display_order: index,
          }));
          await supabase.from('product_variation_options').insert(options);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Product deleted successfully' };
  }

  async decreaseStock(productId: string, quantity: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get current stock
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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
