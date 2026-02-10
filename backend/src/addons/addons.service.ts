import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Injectable()
export class AddonsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(includeInactive = false) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('addons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      // Table may not exist yet (run backend/supabase/addons-schema.sql in Supabase SQL Editor)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return [];
      }
      throw new BadRequestException(error.message || 'Failed to load add-ons');
    }

    if (!data || data.length === 0) return [];

    const addonIds = data.map((a: { id: string }) => a.id);
    let imagesByAddon: Record<string, any[]> = {};
    try {
      const { data: images } = await supabase
        .from('addon_images')
        .select('*')
        .in('addon_id', addonIds)
        .order('display_order', { ascending: true });
      imagesByAddon = (images || []).reduce((acc: Record<string, any[]>, img: any) => {
        const id = img.addon_id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(img);
        return acc;
      }, {});
    } catch {
      // addon_images table may not exist yet
    }

    return data.map((addon: any) => ({
      ...addon,
      addon_images: imagesByAddon[addon.id] || [],
    }));
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('addons')
      .select(`
        *,
        addon_images(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Add-on not found');
    }

    return data;
  }

  async findByProductId(productId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('product_addons')
      .select(`
        display_order,
        addons!inner(
          id,
          name,
          description,
          price,
          is_active,
          addon_images(*)
        )
      `)
      .eq('product_id', productId)
      .eq('addons.is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      // If error, try alternative query structure
      const { data: altData, error: altError } = await supabase
        .from('product_addons')
        .select('display_order, addon_id')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (altError) throw new BadRequestException(altError.message);

      if (!altData || altData.length === 0) return [];

      const addonIds = altData.map((pa: any) => pa.addon_id);
      const { data: addonsData, error: addonsError } = await supabase
        .from('addons')
        .select('*, addon_images(*)')
        .in('id', addonIds)
        .eq('is_active', true);

      if (addonsError) throw new BadRequestException(addonsError.message);

      // Map with display order
      return (addonsData || []).map((addon: any) => {
        const pa = altData.find((p: any) => p.addon_id === addon.id);
        return {
          ...addon,
          display_order: pa?.display_order || 0,
        };
      }).sort((a, b) => a.display_order - b.display_order);
    }

    // Flatten the structure
    return (data || []).map((pa: any) => ({
      ...pa.addons,
      display_order: pa.display_order,
    }));
  }

  async create(createAddonDto: CreateAddonDto) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: addon, error: addonError } = await supabase
      .from('addons')
      .insert({
        name: createAddonDto.name,
        description: createAddonDto.description,
        price: createAddonDto.price,
        is_active: createAddonDto.is_active ?? true,
      })
      .select()
      .single();

    if (addonError) throw new BadRequestException(addonError.message);

    // Add images
    if (createAddonDto.image_urls && createAddonDto.image_urls.length > 0) {
      const images = createAddonDto.image_urls.map((url, index) => ({
        addon_id: addon.id,
        image_url: url,
        display_order: index,
      }));

      await supabase.from('addon_images').insert(images);
    }

    // Link to products
    if (createAddonDto.product_ids && createAddonDto.product_ids.length > 0) {
      const productAddons = createAddonDto.product_ids.map((productId, index) => ({
        product_id: productId,
        addon_id: addon.id,
        display_order: index,
      }));

      await supabase.from('product_addons').insert(productAddons);
    }

    return this.findOne(addon.id);
  }

  async update(id: string, updateAddonDto: UpdateAddonDto) {
    const supabase = this.supabaseService.getAdminClient();

    await this.findOne(id);

    const updateData: any = {};
    if (updateAddonDto.name !== undefined) updateData.name = updateAddonDto.name;
    if (updateAddonDto.description !== undefined) updateData.description = updateAddonDto.description;
    if (updateAddonDto.price !== undefined) updateData.price = updateAddonDto.price;
    if (updateAddonDto.is_active !== undefined) updateData.is_active = updateAddonDto.is_active;

    const { error } = await supabase
      .from('addons')
      .update(updateData)
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    // Update images if provided
    if (updateAddonDto.image_urls) {
      await supabase.from('addon_images').delete().eq('addon_id', id);

      if (updateAddonDto.image_urls.length > 0) {
        const images = updateAddonDto.image_urls.map((url, index) => ({
          addon_id: id,
          image_url: url,
          display_order: index,
        }));
        await supabase.from('addon_images').insert(images);
      }
    }

    // Update product links if provided
    if (updateAddonDto.product_ids) {
      await supabase.from('product_addons').delete().eq('addon_id', id);

      if (updateAddonDto.product_ids.length > 0) {
        const productAddons = updateAddonDto.product_ids.map((productId, index) => ({
          product_id: productId,
          addon_id: id,
          display_order: index,
        }));
        await supabase.from('product_addons').insert(productAddons);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('addons').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Add-on deleted successfully' };
  }
}
