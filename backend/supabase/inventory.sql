-- Inventory: materials, product recipes, and transaction log
-- Run after schema.sql (products table must exist).

-- Materials (raw ingredients / supplies)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('unit','kg','g','m','cm','L','ml')),
  stock_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(10,3),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product recipe: how much of each material is used per 1 unit of product
CREATE TABLE product_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,3) NOT NULL,
  UNIQUE(product_id, material_id)
);

-- Inventory transaction log (restock, deduction, refund, adjustment)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('restock','deduction','refund','adjustment')),
  quantity_change DECIMAL(10,3) NOT NULL,
  quantity_before DECIMAL(10,3) NOT NULL,
  quantity_after DECIMAL(10,3) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_materials_product_id ON product_materials(product_id);
CREATE INDEX idx_product_materials_material_id ON product_materials(material_id);
CREATE INDEX idx_inventory_transactions_material_id ON inventory_transactions(material_id);
CREATE INDEX idx_inventory_transactions_order_id ON inventory_transactions(order_id);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);
