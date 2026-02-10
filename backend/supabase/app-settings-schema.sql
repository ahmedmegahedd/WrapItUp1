-- App settings for mobile app (key-value). Public API reads; admin panel writes.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE app_settings IS 'Mobile app config: home section order, promotion, final CTA, featured limit. Keys: home_section_order, promotion_visible, promotion_title, promotion_message, final_cta_headline, final_cta_subtext, final_cta_button, featured_products_limit';

-- Optional: seed defaults so admin can edit without inserting
INSERT INTO app_settings (key, value)
VALUES
  ('home_section_order', '["hero","featured_collections","featured_products","promotion","value_proposition","final_cta"]'::jsonb),
  ('promotion_visible', 'true'::jsonb),
  ('promotion_title', '"Special offer"'::jsonb),
  ('promotion_message', '"Free delivery on orders over 250 EGP"'::jsonb),
  ('final_cta_headline', '"Ready to surprise someone?"'::jsonb),
  ('final_cta_subtext', '"Browse our collections and order in minutes."'::jsonb),
  ('final_cta_button', '"Browse all collections"'::jsonb),
  ('featured_products_limit', '8'::jsonb)
ON CONFLICT (key) DO NOTHING;
