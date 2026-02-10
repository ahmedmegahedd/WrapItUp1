-- Products recommended in "People also like" at cart/checkout. Admin can select up to 4.
-- Run in Supabase SQL editor.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS recommended_at_checkout BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.recommended_at_checkout IS 'When true, product may appear in app "People also like" at cart (max 4 selected by admin).';
