-- Products Schema Extensions
-- Add fields needed for product seeding: price_type and is_sold_out

-- Add price_type field to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'from'));

-- Add is_sold_out field to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;

-- Create index for price_type
CREATE INDEX IF NOT EXISTS idx_products_price_type ON products(price_type);

-- Create index for is_sold_out
CREATE INDEX IF NOT EXISTS idx_products_is_sold_out ON products(is_sold_out);
