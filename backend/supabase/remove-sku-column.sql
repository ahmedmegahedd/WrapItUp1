-- ============================================================================
-- REMOVE SKU COLUMN FROM PRODUCTS TABLE
-- ============================================================================
-- 
-- This migration removes the SKU column from the products table.
-- The SKU field is no longer needed in the product model.
--
-- IMPORTANT: This will also remove the unique constraint on SKU.
-- The order_items table still has product_sku as a snapshot field,
-- which is fine to keep for historical order data.
--
-- ============================================================================

-- Drop the unique constraint on SKU (if it exists)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- Drop the SKU column
ALTER TABLE products DROP COLUMN IF EXISTS sku;

-- Note: The order_items.product_sku column is kept as a snapshot field
-- for historical order data. It will be set to NULL for new orders.
