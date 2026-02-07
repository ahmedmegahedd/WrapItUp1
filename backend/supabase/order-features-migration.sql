-- ============================================================================
-- ORDER FEATURES: Promo codes, delivery destinations, delivery address/maps,
-- refund notice support. Currency is EGP throughout.
-- ============================================================================

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  expires_at TIMESTAMPTZ,
  max_usage_count INTEGER,
  current_usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

-- Delivery destinations (name + fee in EGP)
CREATE TABLE IF NOT EXISTS delivery_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  fee_egp DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_destinations_active ON delivery_destinations(is_active);

-- Orders: promo and delivery destination fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount_egp DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_destination_id UUID REFERENCES delivery_destinations(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_destination_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_egp DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_maps_link TEXT;

-- Order items: store variation option IDs for stock decrease (optional)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_variation_option_ids JSONB;

-- product_variation_options: per-option stock
ALTER TABLE product_variation_options ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Allow NULL product_sku on order_items for new orders (SKU removed from products)
-- (Skip if your schema already has product_sku nullable.)
-- ALTER TABLE order_items ALTER COLUMN product_sku DROP NOT NULL;

-- Optional: seed one default delivery destination so checkout has a choice
-- INSERT INTO delivery_destinations (name, fee_egp, display_order, is_active)
-- VALUES ('Cairo', 160, 0, true)
-- ON CONFLICT DO NOTHING;
