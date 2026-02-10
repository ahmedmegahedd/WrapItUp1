-- Optional minimum order quantity per product.
-- NULL = no minimum (existing behaviour). Positive integer = minimum when set.
-- Run in Supabase SQL editor.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER NULL;

ALTER TABLE products
ADD CONSTRAINT products_minimum_quantity_positive
CHECK (minimum_quantity IS NULL OR minimum_quantity >= 1);

COMMENT ON COLUMN products.minimum_quantity IS 'Optional minimum order quantity for this product. NULL = no minimum.';
