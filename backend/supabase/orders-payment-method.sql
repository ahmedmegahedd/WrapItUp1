-- Add payment_method to orders for tracking how the customer paid.
-- Values: 'card' | 'apple_pay' | 'instapay' | 'cod'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
