# WrapItUp - E-commerce Platform

A complete production-ready e-commerce platform for selling breakfast trays as gifts.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin only)
- **Storage**: Supabase Storage
- **Payments**: Stripe

## Project Structure

```
WrapItUp/
├── frontend/          # Next.js application
├── backend/           # NestJS application
├── package.json       # Root workspace configuration
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (optional for development)

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `backend/supabase/schema.sql` in your Supabase SQL editor
3. Enable Storage and create a bucket named `product-images` (public):
   - Go to Storage in Supabase dashboard
   - Create new bucket: `product-images`
   - Set it to public
4. Get your Supabase URL and anon key from Settings > API
5. Get your service role key from Settings > API (keep this secret!)
6. Set up initial delivery time slots:
```sql
INSERT INTO delivery_settings (time_slot, is_active, display_order) VALUES
('09:00-12:00', true, 1),
('12:00-15:00', true, 2),
('15:00-18:00', true, 3);
```

### 3. Environment Variables

#### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### Backend (.env)

Copy `backend/env.example` to `backend/.env` and fill in the values:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000
```

**Note**: Stripe keys are optional for development. The app will work with mock payment intents if Stripe is not configured.

### 4. Create Admin User

1. Go to Authentication > Users in Supabase dashboard
2. Click "Add user" and create a new user with email/password
3. Copy the user's UUID from the users table
4. Insert admin record in `admins` table:
```sql
INSERT INTO admins (id, email, created_at) 
VALUES ('user_uuid_from_auth', 'admin@example.com', NOW());
```

Alternatively, you can sign up through the admin login page at `/admin/login` and then manually add the user to the `admins` table.

### 5. Stripe Webhook Setup (Optional)

If using Stripe in production:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3001/api/payments/webhook`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in backend `.env`

For production, configure webhook endpoint in Stripe Dashboard pointing to your production API URL.

### 6. Run Development Servers

```bash
npm run dev
```

This will start both frontend and backend concurrently:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

### Public Site
- Browse products and collections
- Product detail pages with variations
- Delivery date and time slot selection
- Guest checkout
- Stripe payment integration
- Order confirmation

### Admin Panel
- Product management (CRUD)
- Product image uploads
- Product variations
- Collection management
- Order management
- Delivery settings
- Inventory tracking

## Database Schema

See `backend/supabase/schema.sql` for complete database schema.

## API Documentation

The backend API is RESTful. Key endpoints:

### Public Endpoints
- `GET /api/products` - List active products
- `GET /api/products/:id` - Get product details
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/collections` - List active collections
- `GET /api/collections/:id` - Get collection details
- `GET /api/collections/slug/:slug` - Get collection by slug
- `GET /api/delivery/time-slots` - Get available delivery time slots
- `GET /api/delivery/disabled-dates` - Get disabled delivery dates
- `POST /api/orders` - Create order (guest checkout)
- `POST /api/payments/create-intent` - Create Stripe payment intent

### Admin Endpoints (Requires Bearer token)
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get current admin user
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/collections` - List all collections
- `POST /api/admin/collections` - Create collection
- `PATCH /api/admin/collections/:id` - Update collection
- `DELETE /api/admin/collections/:id` - Delete collection
- `GET /api/admin/orders` - List orders (with filters)
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status

### Webhooks
- `POST /api/payments/webhook` - Stripe webhook endpoint

## License

Private - All rights reserved
# WrapItUp
