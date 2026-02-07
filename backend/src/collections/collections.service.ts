import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * When collection.image_url is null, use the first product's primary image (by display_order)
   * as the display image. Does NOT overwrite a manually set collection image.
   */
  private getCollectionDisplayImage(collection: any): string | null {
    if (collection.image_url != null && collection.image_url !== '') {
      return collection.image_url;
    }
    const cps = collection.collection_products;
    if (!cps || !Array.isArray(cps)) return null;
    const sorted = [...cps]
      .filter((cp: any) => cp.products && (cp.products.is_active !== false))
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const first = sorted[0];
    if (!first?.products?.product_images?.length) return null;
    const images = first.products.product_images;
    const byOrder = [...images].sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    const primary = byOrder[0];
    return primary?.image_url ?? null;
  }

  async findAll(includeInactive = false, homepageOnly = false) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('collections')
      .select(`
        *,
        collection_products(
          product_id,
          display_order,
          products(
            id,
            title,
            slug,
            base_price,
            discount_price,
            is_active,
            points_value,
            product_images(image_url, display_order)
          )
        )
      `)
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (homepageOnly) {
      query = query.eq('show_on_homepage', true);
    }

    const { data, error } = await query;

    if (error) throw new BadRequestException(error.message);

    return (data || []).map((c: any) => ({
      ...c,
      image_url: this.getCollectionDisplayImage(c) ?? c.image_url,
    }));
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_products(
          product_id,
          display_order,
          products(
            id,
            title,
            slug,
            base_price,
            discount_price,
            is_active,
            product_images(image_url)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Collection not found');
    }

    if (data && data.collection_products) {
      // Filter out inactive products and sort by display_order
      data.collection_products = data.collection_products
        .filter((cp: any) => cp.products && cp.products.is_active)
        .sort((a: any, b: any) => {
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        });
    }

    data.image_url = this.getCollectionDisplayImage(data) ?? data.image_url;
    return data;
  }

  async findBySlug(slug: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_products(
          product_id,
          display_order,
          products(
            id,
            title,
            slug,
            base_price,
            discount_price,
            is_active,
            product_images(image_url)
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Collection not found');
    }

    if (data && data.collection_products) {
      // Filter out inactive products and sort by display_order
      data.collection_products = data.collection_products
        .filter((cp: any) => cp.products && cp.products.is_active)
        .sort((a: any, b: any) => {
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        });
    }

    data.image_url = this.getCollectionDisplayImage(data) ?? data.image_url;
    return data;
  }

  async create(createCollectionDto: CreateCollectionDto) {
    const supabase = this.supabaseService.getAdminClient();

    const slug = createCollectionDto.slug || this.generateSlug(createCollectionDto.name);

    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .insert({
        name: createCollectionDto.name,
        slug,
        description: createCollectionDto.description,
        image_url: createCollectionDto.image_url,
        is_active: createCollectionDto.is_active ?? true,
        display_order: createCollectionDto.display_order || 0,
        show_on_homepage: createCollectionDto.show_on_homepage ?? false,
        show_in_nav: createCollectionDto.show_in_nav ?? true,
      })
      .select()
      .single();

    if (collectionError) throw new BadRequestException(collectionError.message);

    // Add products to collection
    if (createCollectionDto.product_ids && createCollectionDto.product_ids.length > 0) {
      const collectionProducts = createCollectionDto.product_ids.map((productId, index) => ({
        collection_id: collection.id,
        product_id: productId,
        display_order: index,
      }));

      await supabase.from('collection_products').insert(collectionProducts);
    }

    return this.findOne(collection.id);
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const supabase = this.supabaseService.getAdminClient();

    await this.findOne(id);

    const updateData: any = {};
    if (updateCollectionDto.name !== undefined) updateData.name = updateCollectionDto.name;
    if (updateCollectionDto.slug !== undefined) updateData.slug = updateCollectionDto.slug;
    if (updateCollectionDto.description !== undefined) updateData.description = updateCollectionDto.description;
    if (updateCollectionDto.image_url !== undefined) updateData.image_url = updateCollectionDto.image_url;
    if (updateCollectionDto.is_active !== undefined) updateData.is_active = updateCollectionDto.is_active;
    if (updateCollectionDto.display_order !== undefined) updateData.display_order = updateCollectionDto.display_order;
    if (updateCollectionDto.show_on_homepage !== undefined) updateData.show_on_homepage = updateCollectionDto.show_on_homepage;
    if (updateCollectionDto.show_in_nav !== undefined) updateData.show_in_nav = updateCollectionDto.show_in_nav;

    const { error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    // Update products if provided
    if (updateCollectionDto.product_ids) {
      await supabase.from('collection_products').delete().eq('collection_id', id);

      if (updateCollectionDto.product_ids.length > 0) {
        const collectionProducts = updateCollectionDto.product_ids.map((productId, index) => ({
          collection_id: id,
          product_id: productId,
          display_order: index,
        }));
        await supabase.from('collection_products').insert(collectionProducts);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Collection deleted successfully' };
  }

  /** Set display order for navbar dropdown. orderedIds = array of collection ids in desired order. */
  async updateNavOrder(orderedIds: string[]) {
    const supabase = this.supabaseService.getAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('collections')
        .update({ display_order: i })
        .eq('id', orderedIds[i]);
      if (error) throw new BadRequestException(error.message);
    }
    return { message: 'Nav order updated' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
