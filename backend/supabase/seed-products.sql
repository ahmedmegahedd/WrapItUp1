-- ============================================================================
-- PRODUCTS SEED SCRIPT
-- ============================================================================
-- 
-- This script seeds all products into the database and attaches them to
-- their respective collections.
-- 
-- IMPORTANT NOTES:
-- - This is an IDEMPOTENT script - safe to run multiple times
-- - Uses UPSERT logic based on slug to prevent duplicates
-- - Products may appear in MULTIPLE collections (many-to-many)
-- - Each product exists ONLY ONCE in products table
-- - Images are NOT seeded - leave empty for later insertion
-- - Do NOT delete existing products or collections
--
-- PRICING LOGIC:
-- - "From LE X" → price_type = 'from', base_price = X
-- - Sale prices → base_price (original), discount_price (sale)
-- - "Sold out" → is_sold_out = true
-- - Regular prices → base_price, price_type = 'fixed'
-- - Currency: EGP (stored as numbers only)
--
-- HOW TO RUN:
-- 1. FIRST: Run products-schema-extensions.sql to add price_type and is_sold_out fields
-- 2. Run this script in Supabase SQL editor or via psql
-- 3. Verify products appear in admin panel at /admin/products
-- 4. Verify collection assignments in /admin/collections
--
-- NOTE: "Kids Boxes" and "Seasonal Gifts" collections exist but have no products yet.
--       Products will be added to these collections later.
--
-- ============================================================================

-- Helper function to generate slug from product name
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(product_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- STEP 1: INSERT/UPDATE ALL PRODUCTS
-- ============================================================================

-- Insert or update all products using UPSERT
INSERT INTO products (title, slug, base_price, discount_price, price_type, is_active, is_sold_out, stock_quantity, created_at, updated_at)
VALUES
  -- Letterlicious Trays products
  ('Letterlicious Tray (Large size)', 'letterlicious-tray-large-size', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Letterlicious Tray (Medium size)', 'letterlicious-tray-medium-size', 1350.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Letterlicious Floral Tray', 'letterlicious-floral-tray', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Letterlicious Candy Tray', 'letterlicious-candy-tray', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Letterlicious Gluten Free', 'letterlicious-gluten-free', 2300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Nos w Nos Letterlicious Tray (Large size)', 'nos-w-nos-letterlicious-tray-large-size', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Royal Breakfast Trays products
  ('Heaven Tray (Small size)', 'heaven-tray-small-size', 1550.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Cheese Tray with Cake and Donuts', 'royal-cheese-tray-with-cake-and-donuts', 2800.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Gourmet Cheese Platter', 'gourmet-cheese-platter', 1950.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Cheese Tray with a Cake', 'royal-cheese-tray-with-a-cake', 2900.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Royal Tray with a Cake', 'royal-tray-with-a-cake', 2400.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Cheese Tray', 'royal-cheese-tray', 2700.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Royal Tray', 'royal-tray', 2200.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Royal Fruit Tray with a Cake', 'royal-fruit-tray-with-a-cake', 2300.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Royal Couple Tray', 'royal-couple-tray', 2450.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Love-Frame Twin Tray', 'love-frame-twin-tray', 2600.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Gourmet Platter with Cake', 'gourmet-platter-with-cake', 2300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Anniversary Tray', 'royal-anniversary-tray', 2300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Classic Breakfast Tray', 'royal-classic-breakfast-tray', 2300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Sweet Morning Tray', 'royal-sweet-morning-tray', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Royal Fruit Tray', 'royal-fruit-tray', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Birthday Celebration products (some duplicates from above)
  ('Birthday Box', 'birthday-box', 1800.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Birthday Box 2', 'birthday-box-2', 1700.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Breakfast Offa', 'breakfast-offa', 1300.00, 1200.00, 'fixed', true, false, 0, NOW(), NOW()),
  ('Letterlicious Cupcakes Tray', 'letterlicious-cupcakes-tray', 1600.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Festive Box', 'festive-box', 2800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Dessert Box with a Cake', 'dessert-box-with-a-cake', 2100.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Corporate Gifts products
  ('Corporate Mini Tray', 'corporate-mini-tray', 350.00, 330.00, 'fixed', true, false, 0, NOW(), NOW()),
  ('Corporate Morning Breakfast Tray', 'corporate-morning-breakfast-tray', 280.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Corporate Breakfast Star', 'corporate-breakfast-star', 220.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Breakfast Bites (min 30)', 'breakfast-bites-min-30', 90.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Corporate Fanous (min 5)', 'corporate-fanous-min-5', 420.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Corporate Treat Box (min 30)', 'corporate-treat-box-min-30', 140.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Mini Fruit Cup (min 20)', 'mini-fruit-cup-min-20', 50.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Cheese Boxes products
  ('Cheese Box (Large size)', 'cheese-box-large-size', 1800.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Gourmet Healthy Cheese Platter (Medium size)', 'gourmet-healthy-cheese-platter-medium-size', 1300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Gourmet Cheese Platter (Medium size)', 'gourmet-cheese-platter-medium-size', 1300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Cheese Tower', 'cheese-tower', 2000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Breakfast Boxes products
  ('Breakfast Box for One', 'breakfast-box-for-one', 850.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Sunrise Bites for One', 'sunrise-bites-for-one', 1200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Breakfast Box for Two', 'breakfast-box-for-two', 1500.00, NULL, 'from', true, false, 0, NOW(), NOW()),
  ('Healthy Box', 'healthy-box', 850.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Sunrise Bites for Two', 'sunrise-bites-for-two', 1700.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Sunrise Light Bites for One', 'sunrise-light-bites-for-one', 1300.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Sunrise Light Bites for Two', 'sunrise-light-bites-for-two', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Breakfast Bouquet', 'breakfast-bouquet', 800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Kids Box 3', 'kids-box-3', 1000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Kids Box 2', 'kids-box-2', 1000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Kids Box 1', 'kids-box-1', 1000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Floral Breakfast Box', 'floral-breakfast-box', 1400.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Events Box', 'events-box', 3500.00, 3300.00, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Graduation 2025 products
  ('Letterlicious Graduation Tray', 'letterlicious-graduation-tray', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Graduation Gift 🎓', 'graduation-gift', 2200.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Desserts Collection products
  ('Dessert Box (Large size)', 'dessert-box-large-size', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Dessert Box (Medium size) 1', 'dessert-box-medium-size-1', 1100.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Dessert Bouquet (Small size)', 'dessert-bouquet-small-size', 800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Dessert Box (Medium size) 2', 'dessert-box-medium-size-2', 1100.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Sweet Winter Tray', 'sweet-winter-tray', 800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Dessert Box (Medium size) 3', 'dessert-box-medium-size-3', 1100.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Fruits Boxes products
  ('Fruit Box (Medium size)', 'fruit-box-medium-size', 1000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Fruits Box (Large size) 1', 'fruits-box-large-size-1', 2000.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  
  -- Chocolate Basket products
  ('Mini Bouquet Gift 🌷', 'mini-bouquet-gift', 650.00, NULL, 'fixed', true, true, 0, NOW(), NOW()),
  ('Bouquet Gift 💐', 'bouquet-gift', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Floral & Chocolate Basket', 'floral-chocolate-basket', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW()),
  ('Flowers Roche Box', 'flowers-roche-box', 1800.00, NULL, 'fixed', true, false, 0, NOW(), NOW())
ON CONFLICT (slug) 
DO UPDATE SET
  title = EXCLUDED.title,
  base_price = EXCLUDED.base_price,
  discount_price = EXCLUDED.discount_price,
  price_type = EXCLUDED.price_type,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: ATTACH PRODUCTS TO COLLECTIONS
-- ============================================================================
-- Products are attached to collections in the exact order listed
-- Many-to-many relationship via collection_products table

-- Letterlicious Trays collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'letterlicious-tray-large-size'),
  (2, 'letterlicious-tray-medium-size'),
  (3, 'letterlicious-floral-tray'),
  (4, 'letterlicious-candy-tray'),
  (5, 'letterlicious-gluten-free'),
  (6, 'nos-w-nos-letterlicious-tray-large-size')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'letterlicious-trays'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Royal Breakfast Trays collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'heaven-tray-small-size'),
  (2, 'royal-cheese-tray-with-cake-and-donuts'),
  (3, 'gourmet-cheese-platter'),
  (4, 'royal-cheese-tray-with-a-cake'),
  (5, 'royal-tray-with-a-cake'),
  (6, 'royal-cheese-tray'),
  (7, 'royal-tray'),
  (8, 'royal-fruit-tray-with-a-cake'),
  (9, 'royal-couple-tray'),
  (10, 'love-frame-twin-tray'),
  (11, 'gourmet-platter-with-cake'),
  (12, 'royal-anniversary-tray'),
  (13, 'royal-classic-breakfast-tray'),
  (14, 'royal-sweet-morning-tray'),
  (15, 'royal-fruit-tray')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'royal-breakfast-trays'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Birthday Celebration collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'letterlicious-tray-large-size'),
  (2, 'birthday-box'),
  (3, 'heaven-tray-small-size'),
  (4, 'birthday-box-2'),
  (5, 'royal-cheese-tray-with-cake-and-donuts'),
  (6, 'breakfast-offa'),
  (7, 'royal-cheese-tray-with-a-cake'),
  (8, 'royal-tray-with-a-cake'),
  (9, 'royal-tray'),
  (10, 'royal-fruit-tray-with-a-cake'),
  (11, 'royal-couple-tray'),
  (12, 'letterlicious-candy-tray'),
  (13, 'gourmet-platter-with-cake'),
  (14, 'festive-box'),
  (15, 'dessert-box-with-a-cake'),
  (16, 'royal-classic-breakfast-tray'),
  (17, 'royal-sweet-morning-tray'),
  (18, 'letterlicious-cupcakes-tray')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'birthday-celebration'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Corporate Gifts collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'corporate-mini-tray'),
  (2, 'corporate-morning-breakfast-tray'),
  (3, 'corporate-breakfast-star'),
  (4, 'breakfast-bites-min-30'),
  (5, 'corporate-fanous-min-5'),
  (6, 'corporate-treat-box-min-30'),
  (7, 'mini-fruit-cup-min-20')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'corporate-gifts'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Cheese Boxes collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'letterlicious-tray-large-size'),
  (2, 'letterlicious-tray-medium-size'),
  (3, 'cheese-box-large-size'),
  (4, 'gourmet-cheese-platter'),
  (5, 'royal-cheese-tray-with-a-cake'),
  (6, 'royal-cheese-tray'),
  (7, 'gourmet-platter-with-cake'),
  (8, 'gourmet-healthy-cheese-platter-medium-size'),
  (9, 'gourmet-cheese-platter-medium-size'),
  (10, 'cheese-tower')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'cheese-boxes'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Breakfast Boxes collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'breakfast-box-for-one'),
  (2, 'sunrise-bites-for-one'),
  (3, 'breakfast-box-for-two'),
  (4, 'healthy-box'),
  (5, 'sunrise-bites-for-two'),
  (6, 'sunrise-light-bites-for-one'),
  (7, 'sunrise-light-bites-for-two'),
  (8, 'breakfast-bouquet'),
  (9, 'kids-box-3'),
  (10, 'kids-box-2'),
  (11, 'kids-box-1'),
  (12, 'floral-breakfast-box'),
  (13, 'events-box'),
  (14, 'breakfast-offa')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'breakfast-boxes'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Graduation 2025 collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'letterlicious-tray-large-size'),
  (2, 'letterlicious-graduation-tray'),
  (3, 'events-box'),
  (4, 'graduation-gift')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'graduation-2025'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Desserts Collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'dessert-box-large-size'),
  (2, 'dessert-box-medium-size-1'),
  (3, 'dessert-bouquet-small-size'),
  (4, 'royal-fruit-tray-with-a-cake'),
  (5, 'dessert-box-medium-size-2'),
  (6, 'sweet-winter-tray'),
  (7, 'festive-box'),
  (8, 'dessert-box-with-a-cake'),
  (9, 'dessert-box-medium-size-3')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'desserts-collection'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Fruits Boxes collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'fruit-box-medium-size'),
  (2, 'fruits-box-large-size-1'),
  (3, 'royal-fruit-tray-with-a-cake'),
  (4, 'royal-fruit-tray')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'fruits-boxes'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- Chocolate Basket collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT 
  c.id,
  p.id,
  v.display_order
FROM collections c
CROSS JOIN (VALUES
  (1, 'mini-bouquet-gift'),
  (2, 'bouquet-gift'),
  (3, 'floral-chocolate-basket'),
  (4, 'graduation-gift'),
  (5, 'flowers-roche-box')
) AS v(display_order, slug)
JOIN products p ON p.slug = v.slug
WHERE c.slug = 'chocolate-basket'
ON CONFLICT (collection_id, product_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;

-- ============================================================================
-- VERIFICATION (optional - uncomment to check results)
-- ============================================================================

-- Check products count
-- SELECT COUNT(*) as total_products FROM products;

-- Check collection assignments
-- SELECT 
--   c.name as collection_name,
--   COUNT(cp.product_id) as product_count
-- FROM collections c
-- LEFT JOIN collection_products cp ON cp.collection_id = c.id
-- GROUP BY c.id, c.name
-- ORDER BY c.display_order;

-- Clean up helper functions (optional)
-- DROP FUNCTION IF EXISTS generate_product_slug(TEXT);
-- DROP FUNCTION IF EXISTS generate_product_sku(TEXT);
