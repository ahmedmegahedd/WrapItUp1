-- Loyalty points system
-- Run this migration after your main schema.

-- 1. Add points_value to products (integer >= 0)
ALTER TABLE products ADD COLUMN IF NOT EXISTS points_value INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD CONSTRAINT products_points_value_non_negative CHECK (points_value >= 0);

-- 2. Add points_earned to orders (computed at order creation, granted on payment success)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD CONSTRAINT orders_points_earned_non_negative CHECK (points_earned >= 0);

-- 3. Loyalty accounts (one per customer email)
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT loyalty_accounts_points_balance_non_negative CHECK (points_balance >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_accounts_email ON loyalty_accounts(email);

-- 4. Rewards (redeemable with points)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rewards_points_required_positive CHECK (points_required > 0)
);

-- 5. Points transactions (audit trail)
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment')),
    points INTEGER NOT NULL,
    related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    related_reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_transactions_account ON points_transactions(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON points_transactions(created_at);

-- Trigger for loyalty_accounts updated_at
CREATE TRIGGER update_loyalty_accounts_updated_at
    BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
