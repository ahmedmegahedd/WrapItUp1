-- Delivery Management System Schema
-- This extends the delivery system with advanced admin controls

-- Delivery Days table - tracks availability status for each date
CREATE TABLE IF NOT EXISTS delivery_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'fully_booked', 'unavailable'
    capacity INTEGER, -- Optional: max orders per day (null = unlimited)
    current_orders INTEGER DEFAULT 0, -- Track current order count
    admin_note TEXT, -- Internal admin notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('available', 'fully_booked', 'unavailable'))
);

-- Delivery Time Slots table - structured time intervals
CREATE TABLE IF NOT EXISTS delivery_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL, -- Display label, e.g., "8:00 AM - 10:00 AM"
    start_time TIME NOT NULL, -- Start time (HH:MM:SS)
    end_time TIME NOT NULL, -- End time (HH:MM:SS)
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Update orders table to reference delivery_time_slot_id
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_time_slot_id UUID REFERENCES delivery_time_slots(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_days_date ON delivery_days(date);
CREATE INDEX IF NOT EXISTS idx_delivery_days_status ON delivery_days(status);
CREATE INDEX IF NOT EXISTS idx_delivery_days_date_status ON delivery_days(date, status);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_is_active ON delivery_time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_display_order ON delivery_time_slots(display_order);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time_slot_id ON orders(delivery_time_slot_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_delivery_days_updated_at 
    BEFORE UPDATE ON delivery_days
    FOR EACH ROW EXECUTE FUNCTION update_delivery_updated_at();

CREATE TRIGGER update_delivery_time_slots_updated_at 
    BEFORE UPDATE ON delivery_time_slots
    FOR EACH ROW EXECUTE FUNCTION update_delivery_updated_at();

-- Function to auto-update delivery_days status when capacity is reached
CREATE OR REPLACE FUNCTION check_delivery_day_capacity()
RETURNS TRIGGER AS $$
DECLARE
    day_record delivery_days%ROWTYPE;
    order_count INTEGER;
BEGIN
    -- Get the delivery day record
    SELECT * INTO day_record
    FROM delivery_days
    WHERE date = NEW.delivery_date::DATE;
    
    -- If day record exists and has capacity set
    IF day_record.id IS NOT NULL AND day_record.capacity IS NOT NULL THEN
        -- Count orders for this date
        SELECT COUNT(*) INTO order_count
        FROM orders
        WHERE delivery_date::DATE = NEW.delivery_date::DATE
        AND payment_status = 'paid';
        
        -- Update current_orders
        UPDATE delivery_days
        SET current_orders = order_count,
            status = CASE 
                WHEN order_count >= day_record.capacity THEN 'fully_booked'
                WHEN day_record.status = 'unavailable' THEN 'unavailable'
                ELSE 'available'
            END
        WHERE id = day_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update capacity when order is created/updated
CREATE TRIGGER update_delivery_day_on_order
    AFTER INSERT OR UPDATE OF payment_status ON orders
    FOR EACH ROW
    WHEN (NEW.payment_status = 'paid')
    EXECUTE FUNCTION check_delivery_day_capacity();

-- Insert default time slots if none exist
INSERT INTO delivery_time_slots (label, start_time, end_time, is_active, display_order)
SELECT 
    v.label,
    v.start_time::TIME,
    v.end_time::TIME,
    v.is_active,
    v.display_order
FROM (VALUES
    ('8:00 AM - 10:00 AM', '08:00:00', '10:00:00', true, 1),
    ('10:00 AM - 12:00 PM', '10:00:00', '12:00:00', true, 2),
    ('12:00 PM - 2:00 PM', '12:00:00', '14:00:00', true, 3),
    ('2:00 PM - 4:00 PM', '14:00:00', '16:00:00', true, 4),
    ('4:00 PM - 6:00 PM', '16:00:00', '18:00:00', true, 5)
) AS v(label, start_time, end_time, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM delivery_time_slots);
