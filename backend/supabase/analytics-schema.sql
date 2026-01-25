-- Analytics tables for admin dashboard

-- Product clicks tracking
CREATE TABLE IF NOT EXISTS product_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions tracking (for daily users and live users)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL UNIQUE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_clicked_at ON product_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_product_clicks_session_id ON product_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity_at ON user_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

-- Function to update or insert user session (upsert)
CREATE OR REPLACE FUNCTION upsert_user_session(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_sessions (session_id, last_activity_at)
    VALUES (p_session_id, NOW())
    ON CONFLICT (session_id) 
    DO UPDATE SET last_activity_at = NOW();
END;
$$ LANGUAGE plpgsql;
