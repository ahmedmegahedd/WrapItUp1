-- Seed Admin User
-- 
-- This SQL script creates an admin user.
-- 
-- Steps:
-- 1. First, create a user in Supabase Auth dashboard (Authentication > Users > Add user)
-- 2. Copy the user's UUID
-- 3. Run this SQL with your UUID and email

-- Replace these values:
-- 'YOUR_USER_UUID_HERE' - Get this from Supabase Auth > Users
-- 'admin@wrapitup.com' - Your admin email

INSERT INTO admins (id, email, created_at) 
VALUES (
  'YOUR_USER_UUID_HERE',
  'admin@wrapitup.com',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Or if you want to create a quick test admin (you'll need to create the auth user first):
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: admin@wrapitup.com
-- 4. Password: Admin123!@#
-- 5. Auto Confirm User: ON
-- 6. Copy the User UUID
-- 7. Replace 'YOUR_USER_UUID_HERE' above with the UUID
-- 8. Run this SQL
