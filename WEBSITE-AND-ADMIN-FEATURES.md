# WrapItUp – Website & Admin Panel Features

This document lists all public-facing website features and every admin panel control. Nothing is omitted.

---

## Table of contents

1. [Public website](#public-website)
2. [Admin panel](#admin-panel)
3. [Backend API (reference)](#backend-api-reference)

---

## Public website

The public site is a **single app-focused landing page**. All former catalog/shop routes redirect to `/`.

### Navigation (FloatingNavbar)

- **Location:** Fixed top bar. Hidden on `/admin` routes.
- **Links:** Brand “Wrap It Up” (home), **Admin** (login). No cart or collections on the public site.

### Pages & routes

| Route | Description |
|-------|-------------|
| `/` | **Landing page** – Promotes the mobile app. See [Landing page content](#landing-page-content) below. |
| `/admin/*` | Admin panel (unchanged). All other former public routes redirect to `/`. |

**Redirects (301):** `/about-us`, `/about`, `/products`, `/products/*`, `/collections`, `/collections/*`, `/cart`, `/checkout`, `/order-confirmation`, `/services`, `/contact` → `/`.

### Landing page content

1. **Hero** – Brand “Wrap It Up”, headline: “Breakfast & Gift Boxes Delivered”, short supporting text, primary CTAs: **Download on the App Store**, **Get it on Google Play** (links configurable via `lib/app-download.ts` or env `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL`).
2. **App value** – 3–4 benefit points: order breakfast & gifts easily, choose delivery date & time, earn loyalty points, Arabic & English support.
3. **App preview** – Placeholder area for app screenshots or phone mockups.
4. **Final CTA** – Repeated download buttons.
5. **Footer** – © Wrap It Up, link to Admin.

### SEO & meta (public)

- **Title:** “Wrap It Up App – Order Breakfast & Gifts”.
- **Description:** Explains the app and download. Open Graph and Twitter meta set. `metadataBase`, robots (index, follow).
- No catalog pages; no product/collection SEO on the website (shopping is in the app).

---

## Admin panel

**Base path:** `/admin`.  
**Auth:** Login at `/admin/login`. Session via `admin_token` in `localStorage`. All other admin routes require auth; layout shows nav and logout.

### Admin navigation (layout)

Dropdown in header: **Dashboard**, **Users**, **Products**, **Collections**, **Navbar**, **Add-ons**, **Orders**, **Delivery**, **Delivery Destinations**, **Promo Codes**, **Points & Rewards**, **Homepage**, **Analytics**. **Logout** button.

---

### 1. Dashboard (`/admin`)

- **Stats cards:** Total Products, Total Collections, Total Orders, Total Revenue (sum of paid orders).
- **Shortcuts:** Links to Manage Products, Manage Collections, View Orders.

---

### 2. Users (`/admin/users`)

- **List:** Table of app users (profiles) with columns: User ID (truncated), Full Name, Email, Phone, Last Activity, Total Orders, Points Balance. Paginated (e.g. 20 per page).
- **Search:** Filter by full name, email, or phone (case-insensitive, partial match). Apply via Search button.
- **Expandable row:** Click chevron or “View details” to expand. Fetches full user detail from API. Shows:
  - **User info:** Full name, email, phone, user ID, account creation date, last activity.
  - **Cart snapshot:** Message that cart is stored on device (not available in admin).
  - **Orders:** List of user’s orders (by email); each order expandable to show order number, date, status, payment method, total, points earned, delivery date & time, line items.
- **Export to Excel:** Button “Export to Excel” downloads an `.xlsx` file with all users (respecting current search), columns: User ID, Full Name, Email, Phone, Created At, Last Activity, Total Orders, Points Balance, Cart Items (message), Orders Summary (flattened). UTF-8 safe (e.g. Arabic).
- **Backend:** `GET /admin/users` (paginated, search), `GET /admin/users/export`, `GET /admin/users/:id`.

---

### 3. Products (`/admin/products`, `/admin/products/[id]`)

**List (`/admin/products`):**

- Table: Name, Slug, Price, Status (Active/Inactive), Actions (Edit, Delete).
- **Add Product** → `/admin/products/new`.

**Create/Edit (`/admin/products/new`, `/admin/products/[id]`):**

- **Basic:** Title, Slug, Description, Base price, Discount price, Stock quantity, Is active.
- **Images:** Upload images (with crop/resize). Multiple images; orderable. Stored in Supabase (`product-images`).
- **Variations:** Add variation groups (e.g. “Size”) with options (e.g. “Small”, “Large”) and optional price modifier per option. Display order.
- **Save** creates or updates product. **Delete** on edit page (if not new).

*(Backend also supports `price_type` and `is_sold_out` for display; admin UI may expose these where product form is extended.)*

---

### 4. Collections (`/admin/collections`, `/admin/collections/[id]`)

**List (`/admin/collections`):**

- Table: Name, Slug, Products count, Status (Active/Inactive), Actions (Edit, Delete).
- **Add Collection** → `/admin/collections/new`.

**Create/Edit (`/admin/collections/new`, `/admin/collections/[id]`):**

- **Basic:** Name, Slug, Description, Image (upload with crop), Is active, Display order, **Show on homepage** (checkbox).
- **Products:** Assign products to collection; set **display order** per product within collection.
- Save / Delete.

---

### 5. Navbar (`/admin/navbar-collections`)

- **Purpose:** Control which collections appear in the **site navbar dropdown** and their order.
- **Table:** All collections in current nav order. Columns: **Order** (Up/Down buttons), **Collection** (name + slug), **In navbar** (“Show in dropdown” checkbox).
- **Actions:** Move rows up/down to reorder. Toggle “Show in dropdown” per collection. **Save changes** → updates `show_in_nav` per collection and calls **Nav order** API (`orderedIds`) so dropdown order matches the table.

---

### 6. Add-ons (`/admin/addons`, `/admin/addons/[id]`)

**List (`/admin/addons`):**

- Table: Name, Price, Status, Actions (Edit, Delete).
- **New Add-on** → `/admin/addons/new`.

**Create/Edit (`/admin/addons/new`, `/admin/addons/[id]`):**

- Name, Description, Price, Is active, Images (upload with crop), **Product associations** (which products can show this add-on).
- Save / Delete.

---

### 7. Orders (`/admin/orders`)

- **Filters:** Order status (All, Pending, Preparing, Out for Delivery, Delivered), Payment status (All, Pending, Paid, PENDING_CASH, Failed).
- **Table:** Expand chevron, Order #, Customer (name + email), Delivery date (+ time slot), Total, Payment status, Order status (dropdown), **View details** link. Status can be changed inline via dropdown.
- **Expandable order detail:** Click chevron or “View details” to expand a row. Loads full order from `GET /admin/orders/:id` (no full-page reload). Expanded panel shows:
  - **Order information:** Order number, date/time placed (`created_at`), delivery date, delivery time slot, payment method, payment status, total, points earned, order status (editable dropdown).
  - **Delivery details:** Full delivery address, selected delivery destination (e.g. “New Cairo”, “Nasr City”), delivery fee, “Open in Maps” link if present.
  - **Customer details:** Full name, email, phone, user ID (when customer has a profile for that email).
  - **Items purchased:** Table per item: product name, quantity, selected variations, selected add-ons, unit price, line total.
  - **Customer notes:** Section “Customer notes” with card/gift message if provided at checkout.
  - **Admin notes:** Section “Admin notes” (internal only, never visible to customer). List of notes in chronological order; each shows note text, “Added by: {Admin Name}”, date/time. **Add note:** Text input + “Add note” button; submits to `POST /admin/orders/:id/notes`. List updates immediately after adding.
- **Backend:** `GET /admin/orders/:id` returns order with `order_items`, `admin_notes`, and `customer_user_id`. `POST /admin/orders/:id/notes` (body: `{ note: string }`) adds a note; stores `admin_id`, `admin_name`, `note`, `created_at` in `order_admin_notes` table.

---

### 8. Delivery (`/admin/delivery-settings`)

Two tabs: **Delivery Days** and **Time Slots**.

**Delivery Days tab:**

- **Date range:** Start and end date (e.g. today + 60 days). Loads delivery days in range.
- **Calendar/list:** Each date shows status: **Available**, **Fully booked**, **Unavailable**. Optional capacity and admin note.
- **Per date:** Change status (dropdown); optionally set capacity; save. Bulk actions: e.g. create/mark multiple days.
- **Reset:** **“Reset All to Default”** – resets delivery days (removes overrides so dates behave as default available).

**Time Slots tab:**

- **List:** All delivery time slots with label, start/end time, active state, display order.
- **Add Time Slot** – form: label, start_time, end_time, is_active, display_order. Save.
- **Per slot:** Edit, Toggle active/inactive, Delete, Reorder (reorder API).
- **Reorder:** Save order of time slots (e.g. drag or up/down) via reorder endpoint.

---

### 9. Delivery Destinations (`/admin/delivery-destinations`)

- **List:** Delivery destinations (name, fee EGP, display order, active). Used at checkout for destination selection.
- **CRUD:** Add, edit, delete destinations. Backend: `GET/POST /admin/delivery-destinations`, `GET/PATCH/DELETE /admin/delivery-destinations/:id`.

---

### 10. Promo Codes (`/admin/promo-codes`)

- **List & CRUD:** Create, edit, delete promo codes. Public validation via `POST /promo-codes/validate`. Admin: `GET/POST/PATCH/DELETE /admin/promo-codes` (or under `/promo-codes` with AdminGuard).

---

### 11. Points & Rewards (`/admin/rewards`, `/admin/rewards/[id]`)

- **List:** Loyalty rewards (title, description, points required, active). **Create/Edit:** Add or edit reward; set points required, image, active.
- **Backend:** `GET/POST /admin/rewards`, `GET/PATCH/DELETE /admin/rewards/:id`.

---

### 12. Homepage (`/admin/homepage`)

**Hero text:**

- **Headline** (e.g. line 1 of hero).
- **Subtext** (paragraph under headline).
- **Button label** (e.g. “Explore Collections”).
- **Save** → PATCH hero text. Used by the public homepage hero.

**Hero images:**

- **Upload new hero image:** Choose file → crop (16:9) → upload to Supabase → POST to admin hero-images. Option: **“Set as active when adding”**.
- **List:** All hero images with thumbnail, date, “Active” badge. **Set as active** (only one active). **Remove** (delete).

---

### 13. Analytics (`/admin/analytics`)

- **Time range:** Today, Last 7 Days, Last 30 Days. **Reload** button.
- **Summary cards:** Total Sales, Total Orders, Live Users (active in last 60s, auto-refresh ~10s), Conversion Rate (orders/sessions).
- **Daily users:** Today, Last 7 Days, Last 30 Days (counts).
- **Best selling products:** Table – Rank, Product (title/slug), Orders count, Revenue, Quantity sold.
- **Peak order hours:** When orders are placed most (e.g. by hour).
- **Product clicks:** Which products get the most clicks (from tracking).

*(Exact widgets depend on backend analytics endpoints; the above covers the ones present in the codebase.)*

---

### 14. Admin login (`/admin/login`)

- Email/password (or configured admin auth). On success, store token and redirect to `/admin`. Unauthenticated access to other admin routes redirects to `/admin/login`.

---

## Backend API (reference)

### Public (no admin auth)

- **Collections:** `GET /collections` (optional `includeInactive`, `homepageOnly`). `GET /collections/:id`, `GET /collections/slug/:slug`.
- **Products:** `GET /products`, `GET /products/:id`, `GET /products/slug/:slug`.
- **Delivery:** `GET /delivery/time-slots`, `GET /delivery/available-dates`, `GET /delivery/check-availability/:date`.
- **Homepage:** `GET /homepage/active-hero`, `GET /homepage/hero-text`.
- **Orders:** `POST /orders` (create), `GET /orders/number/:orderNumber` (for confirmation page).
- **Payments:** `POST /payments/create-intent`, `POST /payments/webhook` (Stripe).
- **Add-ons:** `GET /addons`, `GET /addons/product/:productId`, `GET /addons/:id`.
- **Analytics (tracking):** `POST /analytics/track/product-click`, `POST /analytics/track/session`.

### Admin (admin auth required)

- **Auth:** `POST /admin/auth/login`, `GET /admin/auth/me`.
- **Products:** `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`.
- **Collections:** `GET/POST /admin/collections`, `GET/PATCH/DELETE /admin/collections/:id`, **`PATCH /admin/collections/nav-order`** (body: `{ orderedIds: string[] }`).
- **Orders:** `GET /admin/orders` (query: status, paymentStatus, etc.), `GET /admin/orders/:id` (includes `admin_notes`, `customer_user_id`), **`PATCH /admin/orders/:id/status`**, **`POST /admin/orders/:id/notes`** (body: `{ note: string }`).
- **Users:** `GET /admin/users` (query: page, limit, search), `GET /admin/users/export` (query: search), `GET /admin/users/:id`.
- **Delivery:**  
  `GET/POST /delivery/admin/delivery-days`, `PUT /delivery/admin/delivery-days/:id`, `PUT /delivery/admin/delivery-days/date/:date`, `POST /delivery/admin/delivery-days/bulk`, `DELETE /delivery/admin/delivery-days/:id`, **`POST /delivery/admin/delivery-days/reset`**.  
  `GET/POST /delivery/admin/time-slots`, `GET/PUT/DELETE /delivery/admin/time-slots/:id`, **`POST /delivery/admin/time-slots/reorder`**.
- **Homepage:** `GET/POST /admin/homepage/hero-images`, `PATCH /admin/homepage/hero-images/:id/set-active`, `DELETE /admin/homepage/hero-images/:id`, `GET/PATCH /admin/homepage/hero-text`.
- **Analytics (read):** `GET /analytics/product-clicks`, `GET /analytics/daily-users`, `GET /analytics/live-users`, `GET /analytics/conversion-counts`, `GET /analytics/best-selling-products`, `GET /analytics/sales-summary`, `GET /analytics/peak-order-hours`.

**Database (admin features):** `order_admin_notes` table stores internal notes per order (order_id, admin_id, admin_name, note, created_at). Migration: `backend/supabase/order-admin-notes.sql`.

---

## Summary checklist

**Website:** Single **landing page** at `/` (hero, app value, app preview, final CTA, download links, footer). Minimal navbar (brand + Admin). All former catalog routes redirect to `/`. SEO meta for the app landing page.

**Admin:** Dashboard, **Users** (list, search, expandable user detail with orders, export to Excel), Products (CRUD, images, variations), Collections (CRUD, products, show on homepage), Navbar (which collections in dropdown + order), Add-ons (CRUD, product links), **Orders** (list, filters, status update, **expandable order detail**: meta, delivery, customer, items, customer notes, **admin notes** with add/view), Delivery (days: status/capacity/reset; time slots: CRUD, reorder, active), Delivery Destinations (CRUD), Promo Codes (CRUD), Points & Rewards (CRUD), Homepage (hero text + hero images), Analytics (sales, orders, live users, conversion, best sellers, peak hours, product clicks), Login/Logout.

**Backend (admin):** Order notes stored in `order_admin_notes` (admin_id, admin_name, note, created_at). User list/export from `profiles` with order aggregates and loyalty balance by email.

If you add a new page or control (e.g. extra product fields), add it to this document.
