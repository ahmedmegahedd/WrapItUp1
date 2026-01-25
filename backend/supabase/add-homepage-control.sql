-- Add homepage display control to collections
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

-- Update existing collections to show on homepage by default (optional)
-- UPDATE collections SET show_on_homepage = true WHERE is_active = true;
