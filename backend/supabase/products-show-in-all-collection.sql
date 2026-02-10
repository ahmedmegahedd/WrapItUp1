-- When true, product appears in the app "All" collection (Collections tab).
-- Run in Supabase SQL editor.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS show_in_all_collection BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.show_in_all_collection IS 'If true, product appears when user selects "All" in the app Collections tab.';
