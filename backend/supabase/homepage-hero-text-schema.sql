-- Hero text customization (single row)
-- Run in Supabase SQL editor after homepage-hero-schema.sql

CREATE TABLE IF NOT EXISTS homepage_hero_text (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT NOT NULL DEFAULT 'Luxury breakfast gifts for unforgettable mornings',
    subtext TEXT NOT NULL DEFAULT 'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
    button_label TEXT NOT NULL DEFAULT 'Explore Collections',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure exactly one row: insert default if empty
INSERT INTO homepage_hero_text (headline, subtext, button_label)
SELECT
  'Luxury breakfast gifts for unforgettable mornings',
  'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
  'Explore Collections'
WHERE NOT EXISTS (SELECT 1 FROM homepage_hero_text LIMIT 1);

COMMENT ON TABLE homepage_hero_text IS 'Single row: hero headline, subtext, and button label for the homepage';
