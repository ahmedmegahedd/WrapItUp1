-- Control which collections appear in the navbar dropdown and in what order.
-- show_in_nav = true: collection appears in the dropdown
-- display_order: order in the dropdown (lower = first)
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS show_in_nav BOOLEAN DEFAULT true;

-- Existing collections stay in nav by default (show_in_nav = true already via default)
