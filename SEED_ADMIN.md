# Seed Admin User

## Quick Method (Recommended)

### Option 1: Using Node.js Script

1. Make sure you have your `.env` file set up in the `backend` directory
2. Run the seed script:

```bash
cd backend
node scripts/seed-admin.js
```

The script will:
- Create a user in Supabase Auth with email `admin@wrapitup.com` and password `Admin123!@#`
- Add the user to the `admins` table

You can customize the email/password by setting environment variables:
```bash
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourPassword123 node scripts/seed-admin.js
```

### Option 2: Manual SQL Method

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `admin@wrapitup.com` (or your email)
   - Password: `Admin123!@#` (or your password)
   - Auto Confirm User: **ON**
4. Click "Create user"
5. Copy the User UUID from the users table
6. Go to SQL Editor and run:

```sql
INSERT INTO admins (id, email, created_at) 
VALUES ('paste-your-user-uuid-here', 'admin@wrapitup.com', NOW())
ON CONFLICT (id) DO NOTHING;
```

Replace `'paste-your-user-uuid-here'` with the actual UUID.

## Login

After seeding, you can login at:
- URL: `http://localhost:3221/admin/login`
- Email: `admin@wrapitup.com` (or the email you used)
- Password: `Admin123!@#` (or the password you set)

## Troubleshooting

- **User already exists**: The script will automatically add them to the admins table
- **Can't login**: Make sure the user exists in both Supabase Auth AND the `admins` table
- **Script fails**: Check that your `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
