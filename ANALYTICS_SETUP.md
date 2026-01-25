# Analytics System Setup

## Overview
A comprehensive admin analytics dashboard has been built with the following features:

1. **Product Clicks Tracking** - Tracks clicks on products
2. **Daily Users** - Counts unique users per day (Today, Last 7 Days, Last 30 Days)
3. **Live Users** - Shows currently active users (updates every 10 seconds)
4. **Conversion Counts** - Orders and conversion rate
5. **Best Selling Products** - Ranked by orders and revenue
6. **Total Sales & Orders Summary** - Summary cards with time filters
7. **Peak Order Hours** - Last 7 days grouped by hour

## Database Setup

Run the analytics schema migration:

```sql
-- Execute the SQL file
\i backend/supabase/analytics-schema.sql
```

Or manually run the SQL from `backend/supabase/analytics-schema.sql` in your Supabase SQL editor.

This creates:
- `product_clicks` table - Tracks product clicks
- `user_sessions` table - Tracks user sessions
- Indexes for performance
- `upsert_user_session` function - For session heartbeat

## Backend

The analytics module is already integrated into the app:
- **Module**: `backend/src/analytics/analytics.module.ts`
- **Service**: `backend/src/analytics/analytics.service.ts`
- **Controller**: `backend/src/analytics/analytics.controller.ts`

### Endpoints

**Public (no auth required):**
- `POST /api/analytics/track/product-click` - Track product click
- `POST /api/analytics/track/session` - Update user session

**Admin only:**
- `GET /api/analytics/product-clicks` - Get product clicks
- `GET /api/analytics/daily-users?timeRange=today|last_7_days|last_30_days` - Get daily users
- `GET /api/analytics/live-users?activeSeconds=60` - Get live users
- `GET /api/analytics/conversion-counts?timeRange=...` - Get conversion stats
- `GET /api/analytics/best-selling-products` - Get best sellers
- `GET /api/analytics/sales-summary?timeRange=...` - Get sales summary
- `GET /api/analytics/peak-order-hours` - Get peak hours

## Frontend

### Analytics Page
Access at: `/admin/analytics`

Features:
- Time range filter (Today, Last 7 Days, Last 30 Days)
- Reload button to refresh all data
- Auto-refreshing live users (every 10 seconds)
- Clean, modern UI with summary cards and tables

### Tracking

**Session Tracking:**
- Automatically initialized via `AnalyticsProvider` component
- Heartbeat every 30 seconds
- Tracks on page visibility change
- Tracks on user interactions

**Product Click Tracking:**
- Automatically tracked when viewing a product page
- Tracked when clicking product links in collections
- Uses session-based tracking (anonymous)

## Usage

1. **Run database migration** (see Database Setup above)

2. **Start backend** - Analytics endpoints are available

3. **Start frontend** - Analytics page is accessible at `/admin/analytics`

4. **View analytics** - Navigate to Admin Panel > Analytics

## Features

### Product Clicks
- Tracks every product view/click
- Sortable table showing product name and click count
- Helps identify popular products

### Daily Users
- Shows unique users for:
  - Today
  - Last 7 days
  - Last 30 days
- Session-based (anonymous tracking)

### Live Users
- Shows users active in the last 60 seconds
- Auto-updates every 10 seconds
- Lightweight heartbeat system

### Conversion Counts
- Total orders
- Total sessions
- Conversion rate (orders / sessions)
- Filterable by time range

### Best Selling Products
- Ranked by:
  1. Number of orders
  2. Total revenue
- Shows rank, product name, orders count, revenue, quantity
- Reload button to refresh rankings

### Sales Summary
- Total orders count
- Total sales amount
- Filterable by time range

### Peak Order Hours
- Analyzes last 7 days
- Groups by hour (00:00-01:00, etc.)
- Shows top 10 peak hours
- Visual bar chart representation

## Technical Details

- **No external services** - All analytics are self-hosted
- **Efficient queries** - Server-side aggregation
- **Session-based** - Anonymous user tracking
- **Real-time updates** - Live users refresh automatically
- **Admin-only** - All analytics endpoints require admin authentication (except tracking endpoints)

## Notes

- Analytics data starts collecting once the system is running
- Historical data will be available after users interact with the site
- Best selling products ranking updates on reload
- All time-based queries use UTC timestamps
