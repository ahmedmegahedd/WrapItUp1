-- Add-ons system for upselling

-- Add-ons table
CREATE TABLE IF NOT EXISTS addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add-on images table (multiple photos per add-on)
CREATE TABLE IF NOT EXISTS addon_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product add-ons pivot table (with ordering)
CREATE TABLE IF NOT EXISTS product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, addon_id)
);

-- Update order_items to store add-ons snapshot
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_addons_is_active ON addons(is_active);
CREATE INDEX IF NOT EXISTS idx_addon_images_addon_id ON addon_images(addon_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON product_addons(addon_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
