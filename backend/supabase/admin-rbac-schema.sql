-- ============================================================================
-- Admin RBAC: roles, permissions, role_permissions, admins.role_id
-- Run after main schema (admins table exists).
-- ============================================================================

-- Roles (Super Admin has is_super_admin = true and bypasses permission checks)
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions (one row per permission key; new pages add new rows here or via API)
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  permission_group TEXT NOT NULL DEFAULT 'general',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_key ON admin_permissions(key);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_group ON admin_permissions(permission_group);

-- Role-permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Link admins to role (nullable for backward compatibility; assign default role if needed)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);

-- Trigger for admin_roles updated_at (uses existing update_updated_at_column from main schema)
DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE admin_roles IS 'Admin roles for RBAC. One role per admin. Super Admin bypasses permission checks.';
COMMENT ON TABLE admin_permissions IS 'Permission keys (e.g. dashboard.view). New admin pages should register here.';
COMMENT ON TABLE role_permissions IS 'Which permissions each role has.';
