# Setup Steps Summary

## 1. Run Database Migration

First, add the `show_on_homepage` field to collections:

Go to Supabase SQL Editor and run:
```sql
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;
```

## 2. Seed Admin User

### Quick Method (Node.js Script):

```bash
cd backend
npm install  # Install dotenv if needed
node scripts/seed-admin.js
```

This creates:
- Email: `admin@wrapitup.com`
- Password: `Admin123!@#`

### Manual Method:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → Create user with:
   - Email: `admin@wrapitup.com`
   - Password: `Admin123!@#`
   - Auto Confirm: ON
3. Copy the User UUID
4. Run in SQL Editor:
```sql
INSERT INTO admins (id, email, created_at) 
VALUES ('YOUR_USER_UUID_HERE', 'admin@wrapitup.com', NOW());
```

## 3. Login to Admin Panel

- URL: `http://localhost:3221/admin/login`
- Email: `admin@wrapitup.com`
- Password: `Admin123!@#`

## 4. Control Homepage Collections

In Admin → Collections → Edit Collection:
- ✅ Check "Show on Homepage" to display on homepage
- Set "Display Order" to control the order (lower numbers appear first)
- Only collections with "Show on Homepage" checked will appear on the homepage

## 5. Control Product Order in Collections

In Admin → Collections → Edit Collection:
- Products are listed in the "Selected Products" section
- Use ↑ and ↓ buttons to reorder products
- The order number shows the current position
- Products will display in this order on the collection page

## Features Added

✅ **Homepage Collection Control**
- Checkbox to show/hide collections on homepage
- Display order control for homepage collections

✅ **Product Ordering in Collections**
- Up/Down buttons to reorder products
- Products display in the specified order on collection pages

✅ **Admin User Seeding**
- Script to automatically create admin user
- Manual SQL method also available
