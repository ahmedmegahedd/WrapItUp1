-- Homepage hero images: multiple uploads, only one active
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS homepage_hero_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one row can be active (enforced in app; optional partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_hero_images_active
ON homepage_hero_images (is_active)
WHERE is_active = true;

-- Optional: trigger to ensure only one active (uncomment if you want DB-level enforcement)
-- CREATE OR REPLACE FUNCTION ensure_single_active_hero()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.is_active = true THEN
--     UPDATE homepage_hero_images SET is_active = false WHERE id != NEW.id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trigger_single_active_hero
--   BEFORE INSERT OR UPDATE ON homepage_hero_images
--   FOR EACH ROW EXECUTE FUNCTION ensure_single_active_hero();

COMMENT ON TABLE homepage_hero_images IS 'Hero images for homepage; only one should have is_active = true';
