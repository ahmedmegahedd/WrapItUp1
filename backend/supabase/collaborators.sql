-- Collaborator marketplace: vendors who list products on WrapItUp
-- Run after schema.sql and admin RBAC (admins table exists).

-- Collaborators: one row per vendor, linked to admins for login
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id)
);

CREATE INDEX idx_collaborators_admin_id ON collaborators(admin_id);
CREATE INDEX idx_collaborators_is_active ON collaborators(is_active);

-- Add collaborator and approval columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS product_rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_products_collaborator_id ON products(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);

-- WrapItUp own products: set approval_status to 'active' for existing rows where collaborator_id IS NULL
UPDATE products SET approval_status = 'active' WHERE collaborator_id IS NULL AND (approval_status IS NULL OR approval_status = 'pending');

-- Commission records: snapshot per order item for collaborator products
CREATE TABLE commission_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  wrapitup_amount DECIMAL(10,2) NOT NULL,
  payout_status TEXT DEFAULT 'pending',
  payout_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_records_collaborator_id ON commission_records(collaborator_id);
CREATE INDEX idx_commission_records_order_id ON commission_records(order_id);
CREATE INDEX idx_commission_records_payout_status ON commission_records(payout_status);
CREATE INDEX idx_commission_records_created_at ON commission_records(created_at DESC);
