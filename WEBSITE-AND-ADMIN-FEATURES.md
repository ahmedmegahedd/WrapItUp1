# WrapItUp – Website & Admin Panel Features

This document lists all public-facing website features and every admin panel control. Nothing is omitted.

---

## Table of contents

1. [Public website](#public-website)
2. [Admin panel](#admin-panel)
3. [Backend API (reference)](#backend-api-reference)

---

## Public website

### Navigation (FloatingNavbar)

- **Location:** Fixed bottom bar on mobile; fixed top bar on desktop. Hidden on `/admin` routes.
- **Links:** Home, Collections (dropdown), About (Us), Cart.
- **Collections dropdown:** Shows only active collections that have **Show in navbar** enabled, ordered by the admin-defined **Navbar** order. Full list view (no scroll). Click outside or on a link to close.

### Pages & routes

| Route | Description |
|-------|-------------|
| `/` | **Homepage** |
| `/about-us` | **About Us** – Story, values, contact. Static content with SEO. |
| `/collections` | **All collections** – Grid of active collections (image + name), sorted by `display_order`. Links to each collection. |
| `/collections/[slug]` | **Single collection** – Name, description, grid of active products in that collection (with `display_order`). Product click tracking. Links to product pages. |
| `/products/[slug]` | **Product page** – Title, description, images, price (fixed or “from”), variations (e.g. size), quantity, add-ons (if any), Add to Cart. Optional add-ons modal. Optional inline checkout or “Go to checkout”. Product click tracking. |
| `/cart` | **Shopping cart** – List of items with image, title, options, unit price, quantity (update/remove), line total, subtotal. Empty state with “Browse Collections”. Buttons: Continue Shopping, Proceed to Checkout. |
| `/checkout` | **Checkout** – Requires cart items; otherwise redirects to `/collections`. Uses delivery **available dates** and **time slots** from backend. Stripe payment. |
| `/order-confirmation` | **Order confirmation** – Shown after successful payment. Query param `?orderNumber=...`. Displays order number, thank-you message, delivery info. Link back home. |

### Homepage sections (all in `HomePageContent`)

1. **Hero** – Background = active hero image from admin. Overlay with customizable **headline**, **subtext**, **button label** (from admin Homepage). Button links to `/collections`.
2. **Purpose** – “Our purpose” / value proposition (static).
3. **Collections** – “Our Collections” heading + grid of **active** collections (from API). Each card: image, name, description. Links to `/collections/[slug]`.
4. **Horizontal scroll** – Featured / scrolling content (static or configured).
5. **Why** – “Why choose us” (static).
6. **Final CTA** – Call to action + “Shop All Collections” link.
7. **Footer** – Links (e.g. All Collections, Letterlicious Trays, About), copyright.

### Checkout flow (customer)

- **Delivery:** Choose date from **available dates** (next ~60 days, respecting delivery-day status and capacity). Choose **delivery time slot** from active slots.
- **Customer:** Name, email, phone.
- **Optional:** Card message (e.g. gift message).
- **Payment:** Stripe Payment Element. On success → redirect to `/order-confirmation?orderNumber=...` and cart is cleared.

### Cart & product behaviour

- **Cart:** Stored in `localStorage` and React Context. Persists across pages. Cart icon shows item count; click goes to `/cart`.
- **Product:** Can have variations (e.g. size) and optional add-ons. Add-ons modal only shown if the product has linked add-ons. Price can be “fixed” or “from” (e.g. “From LE 50”); sold-out products can be marked `is_sold_out`.

### SEO & analytics (public)

- Metadata (title, description) and breadcrumb schema where applicable.
- **Analytics:** Product click tracking and session tracking (used by admin Analytics).

---

## Admin panel

**Base path:** `/admin`.  
**Auth:** Login at `/admin/login`. Session via `admin_token` in `localStorage`. All other admin routes require auth; layout shows nav and logout.

### Admin navigation (layout)

Dropdown in header: **Dashboard**, **Products**, **Collections**, **Navbar**, **Add-ons**, **Orders**, **Delivery**, **Homepage**, **Analytics**. **Logout** button.

---

### 1. Dashboard (`/admin`)

- **Stats cards:** Total Products, Total Collections, Total Orders, Total Revenue (sum of paid orders).
- **Shortcuts:** Links to Manage Products, Manage Collections, View Orders.

---

### 2. Products (`/admin/products`, `/admin/products/[id]`)

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

### 3. Collections (`/admin/collections`, `/admin/collections/[id]`)

**List (`/admin/collections`):**

- Table: Name, Slug, Products count, Status (Active/Inactive), Actions (Edit, Delete).
- **Add Collection** → `/admin/collections/new`.

**Create/Edit (`/admin/collections/new`, `/admin/collections/[id]`):**

- **Basic:** Name, Slug, Description, Image (upload with crop), Is active, Display order, **Show on homepage** (checkbox).
- **Products:** Assign products to collection; set **display order** per product within collection.
- Save / Delete.

---

### 4. Navbar (`/admin/navbar-collections`)

- **Purpose:** Control which collections appear in the **site navbar dropdown** and their order.
- **Table:** All collections in current nav order. Columns: **Order** (Up/Down buttons), **Collection** (name + slug), **In navbar** (“Show in dropdown” checkbox).
- **Actions:** Move rows up/down to reorder. Toggle “Show in dropdown” per collection. **Save changes** → updates `show_in_nav` per collection and calls **Nav order** API (`orderedIds`) so dropdown order matches the table.

---

### 5. Add-ons (`/admin/addons`, `/admin/addons/[id]`)

**List (`/admin/addons`):**

- Table: Name, Price, Status, Actions (Edit, Delete).
- **New Add-on** → `/admin/addons/new`.

**Create/Edit (`/admin/addons/new`, `/admin/addons/[id]`):**

- Name, Description, Price, Is active, Images (upload with crop), **Product associations** (which products can show this add-on).
- Save / Delete.

---

### 6. Orders (`/admin/orders`)

- **Filters:** Order status (All, Pending, Preparing, Out for Delivery, Delivered), Payment status (All, Pending, Paid, Failed).
- **Table:** Order #, Customer (name + email), Delivery date (+ time slot label), Total, Payment status, Order status (dropdown), **Actions** = change order status via dropdown.
- **Status update:** PATCH order status (pending → preparing → out_for_delivery → delivered). No separate order-detail page in the list; status is edited inline.

---

### 7. Delivery (`/admin/delivery-settings`)

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

### 8. Homepage (`/admin/homepage`)

**Hero text:**

- **Headline** (e.g. line 1 of hero).
- **Subtext** (paragraph under headline).
- **Button label** (e.g. “Explore Collections”).
- **Save** → PATCH hero text. Used by the public homepage hero.

**Hero images:**

- **Upload new hero image:** Choose file → crop (16:9) → upload to Supabase → POST to admin hero-images. Option: **“Set as active when adding”**.
- **List:** All hero images with thumbnail, date, “Active” badge. **Set as active** (only one active). **Remove** (delete).

---

### 9. Analytics (`/admin/analytics`)

- **Time range:** Today, Last 7 Days, Last 30 Days. **Reload** button.
- **Summary cards:** Total Sales, Total Orders, Live Users (active in last 60s, auto-refresh ~10s), Conversion Rate (orders/sessions).
- **Daily users:** Today, Last 7 Days, Last 30 Days (counts).
- **Best selling products:** Table – Rank, Product (title/slug), Orders count, Revenue, Quantity sold.
- **Peak order hours:** When orders are placed most (e.g. by hour).
- **Product clicks:** Which products get the most clicks (from tracking).

*(Exact widgets depend on backend analytics endpoints; the above covers the ones present in the codebase.)*

---

### 10. Admin login (`/admin/login`)

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
- **Orders:** `GET /admin/orders` (query: status, paymentStatus, etc.), `GET /admin/orders/:id`, **`PATCH /admin/orders/:id/status`**.
- **Delivery:**  
  `GET/POST /delivery/admin/delivery-days`, `PUT /delivery/admin/delivery-days/:id`, `PUT /delivery/admin/delivery-days/date/:date`, `POST /delivery/admin/delivery-days/bulk`, `DELETE /delivery/admin/delivery-days/:id`, **`POST /delivery/admin/delivery-days/reset`**.  
  `GET/POST /delivery/admin/time-slots`, `GET/PUT/DELETE /delivery/admin/time-slots/:id`, **`POST /delivery/admin/time-slots/reorder`**.
- **Homepage:** `GET/POST /admin/homepage/hero-images`, `PATCH /admin/homepage/hero-images/:id/set-active`, `DELETE /admin/homepage/hero-images/:id`, `GET/PATCH /admin/homepage/hero-text`.
- **Analytics (read):** `GET /analytics/product-clicks`, `GET /analytics/daily-users`, `GET /analytics/live-users`, `GET /analytics/conversion-counts`, `GET /analytics/best-selling-products`, `GET /analytics/sales-summary`, `GET /analytics/peak-order-hours`.

---

## Summary checklist

**Website:** Homepage (hero, purpose, collections, scroll, why, CTA, footer), About Us, Collections list & collection detail, Product page (variations, add-ons, cart), Cart, Checkout (delivery date/slot, Stripe), Order confirmation, Navbar with configurable collection dropdown, Cart icon and count.

**Admin:** Dashboard, Products (CRUD, images, variations), Collections (CRUD, products, show on homepage), **Navbar** (which collections in dropdown + order), Add-ons (CRUD, product links), Orders (list, filters, status update), Delivery (days: status/capacity/reset; time slots: CRUD, reorder, active), Homepage (hero text + hero images), Analytics (sales, orders, live users, conversion, best sellers, peak hours, product clicks), Login/Logout.

If you add a new page or control (e.g. order detail page, extra product fields), add it to this document.
