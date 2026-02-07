import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HomepageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private getClient() {
    return this.supabaseService.getAdminClient();
  }

  /** Public: get the currently active hero image URL (or null) */
  async getActiveHeroImage(): Promise<{ image_url: string } | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('homepage_hero_images')
      .select('image_url')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return data ? { image_url: data.image_url } : null;
  }

  /** Admin: list all hero images (newest first) */
  async listHeroImages(): Promise<{ id: string; image_url: string; is_active: boolean; created_at: string }[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('homepage_hero_images')
      .select('id, image_url, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Admin: add a new hero image (optionally set as active) */
  async addHeroImage(imageUrl: string, setAsActive = false): Promise<{ id: string; image_url: string; is_active: boolean; created_at: string }> {
    const supabase = this.getClient();
    if (setAsActive) {
      await supabase.from('homepage_hero_images').update({ is_active: false }).eq('is_active', true);
    }
    const { data, error } = await supabase
      .from('homepage_hero_images')
      .insert({ image_url: imageUrl, is_active: setAsActive })
      .select('id, image_url, is_active, created_at')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Admin: set one image as active (others become inactive) */
  async setActive(id: string): Promise<{ id: string; image_url: string; is_active: boolean; created_at: string }> {
    const supabase = this.getClient();
    const { data: existing, error: findError } = await supabase
      .from('homepage_hero_images')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) throw new NotFoundException('Hero image not found');

    await supabase.from('homepage_hero_images').update({ is_active: false }).eq('is_active', true);
    const { data, error } = await supabase
      .from('homepage_hero_images')
      .update({ is_active: true })
      .eq('id', id)
      .select('id, image_url, is_active, created_at')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Admin: delete a hero image */
  async deleteHeroImage(id: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('homepage_hero_images').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
  }

  /** Public: get hero text (headline, subtext, button label) */
  async getHeroText(): Promise<{ headline: string; subtext: string; button_label: string }> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('homepage_hero_text')
      .select('headline, subtext, button_label')
      .limit(1)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (data) return data;
    return {
      headline: 'Luxury breakfast gifts for unforgettable mornings',
      subtext:
        'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
      button_label: 'Explore Collections',
    };
  }

  /** Admin: update hero text */
  async updateHeroText(updates: {
    headline?: string;
    subtext?: string;
    button_label?: string;
  }): Promise<{ headline: string; subtext: string; button_label: string }> {
    const supabase = this.getClient();
    const { data: existing, error: findError } = await supabase
      .from('homepage_hero_text')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (findError) throw new BadRequestException(findError.message);

    const payload: Record<string, string> = {};
    if (updates.headline !== undefined) payload.headline = updates.headline;
    if (updates.subtext !== undefined) payload.subtext = updates.subtext;
    if (updates.button_label !== undefined) payload.button_label = updates.button_label;
    if (Object.keys(payload).length === 0) return this.getHeroText();

    if (existing) {
      const { data, error } = await supabase
        .from('homepage_hero_text')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('headline, subtext, button_label')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const { data, error } = await supabase
      .from('homepage_hero_text')
      .insert({
        headline: payload.headline ?? 'Luxury breakfast gifts for unforgettable mornings',
        subtext:
          payload.subtext ??
          'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
        button_label: payload.button_label ?? 'Explore Collections',
      })
      .select('headline, subtext, button_label')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
