-- ============================================================================
-- COLLECTIONS SEED SCRIPT
-- ============================================================================
-- 
-- This script seeds the initial collections data into the database.
-- 
-- IMPORTANT NOTES:
-- - This is an IDEMPOTENT script - safe to run multiple times
-- - It uses UPSERT logic based on slug to prevent duplicates
-- - Only collections are seeded here - products will be added later
-- - All collections are created as ACTIVE by default
-- - Display order reflects the exact order listed below
--
-- HOW TO RUN:
-- 1. Connect to your Supabase database
-- 2. Run this SQL script in the SQL editor or via psql
-- 3. Verify collections appear in admin panel at /admin/collections
--
-- COLLECTIONS TO SEED (in order):
-- 1. Letterlicious Trays
-- 2. Royal Breakfast Trays
-- 3. Birthday Celebration
-- 4. Corporate Gifts
-- 5. Cheese Boxes
-- 6. Breakfast Boxes
-- 7. Graduation 2025
-- 8. Desserts Collection
-- 9. Fruits Boxes
-- 10. Chocolate Basket
-- 11. Kids Boxes
-- 12. Seasonal Gifts
--
-- ============================================================================

-- Seed collections using UPSERT (INSERT ... ON CONFLICT)
-- This ensures the script is idempotent and won't create duplicates
-- Slugs are auto-generated: lowercase, kebab-case (spaces to hyphens)
INSERT INTO collections (name, slug, is_active, display_order, created_at, updated_at)
VALUES
  ('Letterlicious Trays', 'letterlicious-trays', true, 1, NOW(), NOW()),
  ('Royal Breakfast Trays', 'royal-breakfast-trays', true, 2, NOW(), NOW()),
  ('Birthday Celebration', 'birthday-celebration', true, 3, NOW(), NOW()),
  ('Corporate Gifts', 'corporate-gifts', true, 4, NOW(), NOW()),
  ('Cheese Boxes', 'cheese-boxes', true, 5, NOW(), NOW()),
  ('Breakfast Boxes', 'breakfast-boxes', true, 6, NOW(), NOW()),
  ('Graduation 2025', 'graduation-2025', true, 7, NOW(), NOW()),
  ('Desserts Collection', 'desserts-collection', true, 8, NOW(), NOW()),
  ('Fruits Boxes', 'fruits-boxes', true, 9, NOW(), NOW()),
  ('Chocolate Basket', 'chocolate-basket', true, 10, NOW(), NOW()),
  ('Kids Boxes', 'kids-boxes', true, 11, NOW(), NOW()),
  ('Seasonal Gifts', 'seasonal-gifts', true, 12, NOW(), NOW())
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Verify the seed (optional - uncomment to check results)
-- SELECT name, slug, is_active, display_order FROM collections ORDER BY display_order;
