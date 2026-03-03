-- Admin-only notes per order. Internal use only; never visible to customers.
CREATE TABLE IF NOT EXISTS order_admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_admin_notes_order_id ON order_admin_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_admin_notes_created_at ON order_admin_notes(created_at);

COMMENT ON TABLE order_admin_notes IS 'Internal admin notes for orders. Not visible to customers.';
