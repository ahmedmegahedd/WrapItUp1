-- ============================================================================
-- Seed: admin_permissions (all known permissions), Super Admin role
-- Run after admin-rbac-schema.sql
-- ============================================================================

-- Insert permissions (key must match backend/frontend; new pages add new rows here)
INSERT INTO admin_permissions (key, label, permission_group, display_order) VALUES
  ('dashboard.view', 'Dashboard', 'general', 10),
  ('users.view', 'Users', 'general', 20),
  ('products.view', 'Products', 'general', 30),
  ('collections.view', 'Collections', 'general', 40),
  ('navbar.view', 'Navbar', 'general', 50),
  ('addons.view', 'Add-ons', 'general', 60),
  ('orders.view', 'Orders', 'general', 70),
  ('delivery.view', 'Delivery', 'general', 80),
  ('delivery_destinations.view', 'Delivery Destinations', 'general', 90),
  ('promo_codes.view', 'Promo Codes', 'general', 100),
  ('rewards.view', 'Points & Rewards', 'general', 110),
  ('homepage.view', 'Homepage', 'general', 120),
  ('analytics.view', 'Analytics', 'general', 130),
  ('admin_controls.view', 'Admin Controls', 'general', 140),
  ('inventory.view', 'Inventory', 'general', 145)
ON CONFLICT (key) DO NOTHING;

-- Super Admin role (cannot be deleted; backend checks is_super_admin)
INSERT INTO admin_roles (id, name, is_super_admin) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Admin', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_super_admin = EXCLUDED.is_super_admin;

-- Backfill: existing admins with no role get Super Admin (preserve current behavior)
UPDATE admins SET role_id = (SELECT id FROM admin_roles WHERE is_super_admin = true LIMIT 1) WHERE role_id IS NULL;

-- To create the Super Admin user (admin@wrapitup.com):
-- 1. In Supabase Dashboard: Authentication > Users > Add user
--    Email: admin@wrapitup.com
--    Password: Admin123!@#
--    Auto Confirm User: ON
-- 2. Copy the new user's UUID, then run:
--    INSERT INTO admins (id, email, role_id) VALUES
--      ('PASTE_UUID_HERE', 'admin@wrapitup.com', '00000000-0000-0000-0000-000000000001')
--    ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id;
