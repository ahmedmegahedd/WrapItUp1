# Quick Setup Guide

## 1. Install Dependencies

```bash
npm run install:all
```

## 2. Set Up Supabase

1. Create project at https://supabase.com
2. Run `backend/supabase/schema.sql` in SQL Editor
3. Create Storage bucket `product-images` (public)
4. Add delivery time slots:
```sql
INSERT INTO delivery_settings (time_slot, is_active, display_order) VALUES
('09:00-12:00', true, 1),
('12:00-15:00', true, 2),
('15:00-18:00', true, 3);
```

## 3. Configure Environment

### Frontend
Copy `frontend/.env.example` to `frontend/.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (default: http://localhost:3001)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional)

### Backend
Copy `backend/env.example` to `backend/.env` and fill in:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` (optional - app works without it)
- `STRIPE_WEBHOOK_SECRET` (optional)

## 4. Create Admin User

1. Sign up at `/admin/login` OR create user in Supabase Auth dashboard
2. Get user UUID from Supabase
3. Add to admins table:
```sql
INSERT INTO admins (id, email, created_at) 
VALUES ('user-uuid-here', 'your-email@example.com', NOW());
```

## 5. Run

```bash
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- API: http://localhost:3001/api

## First Steps

1. Login to admin panel
2. Create a product with images
3. Create a collection
4. Add product to collection
5. Test checkout flow

## Notes

- Stripe is optional - app uses mock payments if not configured
- Product images upload to Supabase Storage
- Orders automatically decrease inventory
- Delivery dates can be disabled in database
