# Wrap It Up — Mobile Application: Full Feature & Implementation Description

This document describes every feature and implementation detail of the Wrap It Up Expo / React Native mobile app.

---

## 1. Technology Stack

- **Framework:** React Native with **Expo** (SDK 54)
- **Routing:** **Expo Router** (file-based routing; Stack and Tabs)
- **Language:** TypeScript
- **State:** React Context for global state; AsyncStorage for persistence where needed
- **UI:** React Native core components; **expo-image** for images (AVIF support); **expo-linear-gradient**; **@react-native-community/datetimepicker** for date picker
- **Maps:** **react-native-maps** and **expo-location** for the delivery address map picker
- **Payments:** **@stripe/stripe-react-native** (present in the app; current checkout flow uses “Place order” only, no payment UI)
- **Backend:** Axios client to the same NestJS API used by the website and admin panel (`EXPO_PUBLIC_API_URL`)
- **Auth:** **Supabase** (email/password; session restored on app launch)
- **Notifications:** **expo-notifications** (push token registration; optional order confirmation push from backend)

---

## 2. App Entry & Launch

### 2.1 Root layout (`app/_layout.tsx`)

- **expo-splash-screen:** Native splash is kept visible until auth is ready (`SplashScreen.preventAutoHideAsync()`).
- **Providers (wrapping order):**  
  `StripeProvider` → `AuthProvider` → `LanguageProvider` → `PointsBalanceProvider` → `AddressesProvider` → `PendingDeliveryProvider` → `SavedProductsProvider` → `CheckoutPaymentProvider` → `CartProvider`.
- **App content:** RTL/LTR is applied at the root `View` using `direction: isRTL ? 'rtl' : 'ltr'` from `LanguageContext`.
- **SplashGate:** After auth loading finishes, native splash is hidden and the custom **AnimatedSplash** overlay is shown once.
- **Stack:** All screens are registered in a single Stack (tabs, auth, collection, product, checkout, delivery map, order confirmation, account screens, etc.). Header is hidden by default; individual screens can show a header.

### 2.2 Animated splash (`components/AnimatedSplash.tsx`)

- Full-screen **brand pink** background (`colors.primary`).
- **Logo:** Centered, using **expo-image** with `wrapitup.avif` (AVIF supported). Size 280×78.
- **Animation (when reduce motion is off):**  
  - Short intro delay (pink only).  
  - Logo fades in and scales up (opacity 0→1, scale 0.6→1.08→1) with easing.  
  - After a settle pause, overlay fades out and logo scales down slightly; then `onFinish()` is called and the overlay is removed.
- **Reduce motion:** If the system has “reduce motion” enabled, the overlay is not shown and `onFinish()` is called immediately.
- Ensures the app never opens with a blank screen; the logo is always visible during the animation.

### 2.3 SplashGate (`components/SplashGate.tsx`)

- Waits for **AuthContext** loading to finish.
- Then hides the native splash and sets phase to `showing`, so **AnimatedSplash** is rendered.
- When AnimatedSplash calls `onFinish`, phase becomes `done` and the overlay is unmounted. Children (main app) are always rendered; the overlay is drawn on top until the animation completes.

---

## 3. Navigation Structure

### 3.1 Entry and onboarding

- **`app/index.tsx`:** Entry screen; typically redirects to onboarding (if not yet seen) or to tabs.
- **`app/onboarding.tsx`:** Optional onboarding carousel. Fetches config from `GET /onboarding/config`. If enabled and slides exist, shows a horizontal list of slides (title, subtitle, icon). Skip and Get started buttons; after completion, stores “seen” in AsyncStorage and replaces to `/(tabs)`. RTL-aware.

### 3.2 Tabs (`app/(tabs)/_layout.tsx`)

- **Custom tab bar:** `GlassyTabBar` (floating pill-style bar).
- **Visible tabs:** Home, Collections, Cart, Account.
- **Hidden from bar but reachable:** Rewards, Orders (`href: null`); linked from Account.
- **Header:** Centered app logo (`AppHeaderTitle`), rewards button on the right (`HeaderRewardsButton`).
- **Cart badge:** Shows item count when > 0.

### 3.3 Stack screens (outside tabs)

- **`collection/[slug]`** — Collection detail (hero, filter/sort row, product grid).
- **`product/[slug]`** — Product detail (gallery, variations, add-ons, add to cart).
- **`checkout`** — Checkout form and “Place order”.
- **`select-payment-method`** — Payment method selection (in tree; current flow does not navigate here).
- **`delivery-address-map`** — Map picker for delivery address (reverse geocoding, save, return to checkout).
- **`order-confirmation`** — Order success (order number, summary, track, back to home, order history).
- **`(account)/*`** — Account group (e.g. saved products).
- **`account-personal`**, **`account-language`**, **`talk-to-us`** — Account and support screens.

---

## 4. Internationalization (i18n) & RTL

### 4.1 Language context (`contexts/LanguageContext.tsx`)

- **Languages:** English (`en`) and Arabic (`ar`).
- **Persistence:** Current language stored in AsyncStorage (`@wrapitup_language`).
- **RTL:** When language is `ar`, `I18nManager.forceRTL(true)` is applied so layout and text direction flip.
- **API:** `language`, `setLanguage(lang)`, `isRTL`.

### 4.2 Translations (`lib/i18n.ts`)

- **Structure:** `copy[language][key]`; function `t(language, key)` returns the string for the current language (fallback to English).
- **Coverage:** All user-facing strings (tabs, auth, home, collections, cart, checkout, orders, account, rewards, errors, buttons, labels, etc.) use `t(language, key)` so the app is fully localizable.
- **Keys:** Single source of keys from `copy.en`; TypeScript type `I18nKey` for type-safe usage.

---

## 5. Authentication

### 5.1 Auth context (`contexts/AuthContext.tsx`)

- **Provider:** Supabase client; subscribes to auth state changes and exposes `session`, `loading`, `signedIn`, `signIn`, `signOut`, `register`.
- **Persistence:** Supabase handles session persistence; on launch the app restores the session and SplashGate waits for `loading` to be false before showing the animated splash and main UI.
- **Registration:** Uses backend `POST /auth/register` (email, password, phone, optional full_name); backend creates Supabase user and profile.

### 5.2 Auth screens

- **`(auth)/login.tsx`:** Email + password login; Supabase sign-in; validation and error messages via i18n.
- **`(auth)/register.tsx`:** Registration form (email, password, phone, optional name); calls backend register; then can sign in.
- **Guards:** Some screens (e.g. rewards, saved products) show “Sign in” prompts or redirect to login when the user is not signed in.

---

## 6. Home Screen

### 6.1 Data and layout

- **Hooks:** `useAppSettings()` (section order, promotion, final CTA, featured limit) and `useHomeData()` (featured collections, featured products).
- **Sections (order configurable from admin):**  
  Hero, Featured collections, Featured products, Promotion, Value proposition, Final CTA.
- **Pull-to-refresh:** Refreshes home data.
- **Loading:** Skeleton home when loading and no data yet.

### 6.2 Home sections (`components/home/`)

- **HeroSection:** Fetches active hero image and hero text from API; full-width image with overlay and CTA button (e.g. “Shop collections”). Uses expo-image.
- **FeaturedCollectionsSection:** Grid or list of collection bubbles (image + title); taps go to `collection/[slug]`.
- **FeaturedProductsSection:** Product cards (image, title, price, points); tap to product detail.
- **PromotionSection:** Optional banner (title + message) from app settings.
- **ValuePropositionSection:** Static “Why choose us” blocks (quality, delivery, gifts, support) with i18n text.
- **FinalCTASection:** Headline, subtext, and button (e.g. “Browse all collections”) from app settings.

---

## 7. Collections

### 7.1 Collections tab (`app/(tabs)/collections.tsx`)

- **Data:** Fetches all collections (or navbar collections); supports a horizontal collection switcher (bubbles).
- **“All” collection:** Can show products from a combined or default collection.
- **Products:** Fetched per selected collection via `getCollectionBySlug`; products listed in a grid; pull-to-refresh.
- **UI:** Collection bubbles at top; product grid below (EditorialProductCard or similar).

### 7.2 Collection detail (`app/collection/[slug].tsx`)

- **Hero:** `CollectionHero` — full-width collection image (or placeholder), height ~40% of screen width, dark gradient overlay, centered title and description (white text). Uses expo-image and LinearGradient.
- **Filter/sort row:** `FilterSortRow` — two equal-width controls (Filter, Sort) below the hero; i18n labels; no backend filter/sort logic yet.
- **Product grid:** Same as before — 2 columns, product cards (image, title, price, points, save button); tap to product detail. Pull-to-refresh.
- **Loading:** Skeleton hero + skeleton filter row + skeleton grid.
- **Data:** `getCollectionBySlug(slug)` returns collection with `name`, `description`, `image_url`, `collection_products` (with nested products).

---

## 8. Product Detail

### 8.1 Data and state

- **API:** `getProductBySlug(slug)`, `getProductAddons(productId)`.
- **State:** Product, add-ons list, selected variations (per variation name → option id), selected add-on ids, quantity, “added to cart” state, optional add-on suggestion modal state.
- **Focus:** Refetches product when screen gains focus (and when slug changes). Pull-to-refresh.

### 8.2 Variations and add-ons

- **Variations:** Product can have `product_variations` (e.g. size, type) with `product_variation_options` (label, price modifier). User selects one option per variation; unit price includes modifiers. Minimum quantity from product is respected.
- **Add-ons:** Fetched by product id; user can select multiple add-ons; prices added to line total. If product has add-ons and user adds to cart, an optional “add-on suggestion” modal can appear.
- **Quantity:** Stepper (+, −) with min = product’s `minimum_quantity` (default 1).

### 8.3 Add to cart

- **Calculation:** Unit price (base/discount + variation modifiers) × quantity + add-on prices. `calculated_price` and optional `points_value` stored per cart line.
- **Haptics:** Success haptic on add. Optional “Added to cart!” feedback (e.g. button text change).
- **Save product:** Heart/save button (SaveProductButton) toggles saved state; persisted via SavedProductsContext.

### 8.4 UI

- Image gallery (primary image or carousel if multiple); product title, price, points earned; variation pickers; add-on checkboxes; quantity; Add to cart (or slide-to-add) button. Skeleton while loading.

---

## 9. Cart

### 9.1 Cart context (`contexts/CartContext.tsx`)

- **State:** `items` (array of CartItem: product_id, title, slug, image, prices, quantity, selected_variations, selected_addons, calculated_price, points_value, minimum_quantity, etc.).
- **Persistence:** Saved to AsyncStorage (`@wrapitup_cart`) after hydration and on every change.
- **API:** `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`, `getPointsEarned`.
- **Rules:** Quantity cannot go below product’s `minimum_quantity` when set.

### 9.2 Cart screen (`app/(tabs)/cart.tsx`)

- **List:** Each item shows thumbnail, title, price, quantity stepper, remove; line total. Points earned shown (e.g. gradient pill) when applicable.
- **Summary:** Subtotal, delivery (placeholder or from destination), total; all with formatted prices (EGP, commas).
- **People also like:** Horizontal list of “recommended at checkout” products (admin-configured, up to 4); excludes items already in cart; tap to product.
- **Checkout CTA:** Button to navigate to `checkout` (e.g. “Proceed to checkout”).
- **Empty state:** Message and button to browse collections.

---

## 10. Checkout

### 10.1 Checkout screen (`app/checkout.tsx`)

- **Prerequisite:** Cart must have items; otherwise a message and “Go back” are shown.
- **Form fields (all i18n):**  
  Customer name, email, phone (optional).  
  Delivery date (horizontal scroll of date chips + “See more” that opens a date picker modal).  
  Time slot (chips, shown after a date is selected).  
  Destination (if delivery destinations exist).  
  Delivery address (text).  
  Google Maps link (required).  
  “Pick on map” button → opens **delivery-address-map**; on confirm, address and maps link are set and user returns to checkout.  
  Optional saved-address picker (if user has saved addresses).  
  Promo code (apply validates via API; discount shown).  
  Card/gift message (optional).
- **Summary:** Points earned (gradient), subtotal, delivery fee, total (formatted EGP). Order of summary items and number formatting (e.g. commas) as implemented.
- **Validation:** Required fields validated before submit (name, email, date, time slot, destination if any, address, maps link).
- **Place order:** Single primary action — **“Place order”** (i18n `placeOrder`). On tap: validate → `createOrder` with same payload as before plus `payment_method: 'cod'`. No payment UI; no navigation to select-payment-method. On success: success haptic, `setSubmitting(false)`, then `requestAnimationFrame` + `router.push('/order-confirmation', { orderNumber })`. No cart clear or AsyncStorage write on checkout screen (handled on order-confirmation). On API error, alert is shown and submitting is reset.

### 10.2 Delivery address map (`app/delivery-address-map.tsx`)

- **Map:** `react-native-maps`; initial region (e.g. Cairo). User can drag map; on region change complete, reverse geocoding runs (Google Geocoding API via `lib/geocoding.ts`).
- **Address:** Resolved address and optional coordinates; displayed; user can confirm and optionally save to addresses (AddressesContext) and/or set as “pending delivery” (PendingDeliveryContext) so checkout form is pre-filled when returning to checkout.
- **Errors:** Geocoding errors (e.g. REQUEST_DENIED) shown with optional hint (e.g. enable Geocoding API, key restrictions). RTL-aware.

### 10.3 Addresses and pending delivery

- **AddressesContext:** Manages saved addresses (CRUD); persisted (e.g. AsyncStorage or backend if implemented); used in checkout and delivery-address-map.
- **PendingDeliveryContext:** Holds “pending” delivery address/link set from the map; when checkout gains focus, it can take this pending data and pre-fill the form, then clear pending.

---

## 11. Order Creation & Confirmation

### 11.1 Order creation (backend)

- **Endpoint:** `POST /orders` with payload: customer details, delivery date, time_slot_id, destination_id, delivery_fee_egp, address, maps_link, promo_code_id, discount_amount_egp, card_message, **payment_method: 'cod'**, items (product_id, quantity, selected_variations, selected_addons).
- **Backend behavior:** For `payment_method: 'cod'`, order is created with `payment_status: 'PENDING_CASH'` and the same finalization logic runs (decrease stock, grant loyalty points, send confirmation email, send push if token registered). Order appears in admin and in “Past orders” once the app stores the order number.

### 11.2 Order confirmation screen (`app/order-confirmation.tsx`)

- **Params:** `orderNumber` from route.
- **Data:** `getOrderByNumber(orderNumber)` to fetch full order (with order_items).
- **Display:** Success icon; thank-you title; order number; total; points earned (if any); delivery date; time slot; delivery address; payment method (e.g. Cash on Delivery); order summary (line items and totals). “Track order” (opens delivery maps link if present). “Back to Home”, “View order history”.
- **Side effects:** When order is loaded: refetch points balance if `points_earned > 0`; append `orderNumber` to AsyncStorage list (`@wrapitup_order_numbers`); after a short delay, `clearCart()`. Optional: register Expo push token with backend for this email (for future order confirmation pushes).
- **Loading / error:** Loading spinner while fetching; if order not found, message and “Back to home”.

---

## 12. Past Orders

### 12.1 Orders screen (`app/(tabs)/orders.tsx`)

- **Data source:** Order numbers stored in AsyncStorage (`@wrapitup_order_numbers`). For each number, `getOrderByNumber` is called to fetch order details.
- **List:** Sorted by date (newest first); each item shows order number, total, delivery date, time slot, payment status badge (e.g. Paid, Pending, Cash (pending)), order status.
- **Refresh:** Pull-to-refresh and focus effect refetch the list so a newly placed order appears after the user opens Orders (order number was added on order-confirmation load).
- **Empty state:** Message that orders will appear after checkout.

---

## 13. Loyalty & Rewards

### 13.1 Points balance (`contexts/PointsBalanceContext.tsx`)

- **API:** `getLoyaltyBalance(email)` when user is signed in. Exposes `balance`, `refetch`.
- **Usage:** Shown in account and rewards; refetched after order confirmation when the order has `points_earned`.

### 13.2 Rewards screen (`app/(tabs)/rewards.tsx`)

- **API:** `getRewards()` for active rewards; balance from PointsBalanceContext.
- **UI:** Lists rewards (e.g. redeem for X points); shows “Your balance: X points”. Redeem action can call `redeemReward(email, rewardId)`. Sign-in prompt if not signed in.
- **Copy:** i18n for need more points, can redeem, etc.

---

## 14. Account

### 14.1 Account screen (`app/(tabs)/account.tsx`)

- **Header:** User full name (from session metadata) or “Account”.
- **Sections (list rows):** Personal info → account-personal; Past orders → orders tab; Saved products → (account)/saved-products; Language → account-language; Rewards → rewards tab; Support & Legal (contact, privacy, terms, refund); Log out.
- **Add phone banner:** If signed in and no phone in metadata, shows hint to add phone later (e.g. for phone login).
- **Log out:** Confirmation alert; then signOut and replace to login.

### 14.2 Account sub-screens

- **account-personal:** Edit profile (name, etc.); uses Auth and/or backend profile if implemented.
- **account-language:** Language switcher (English / Arabic); persists and applies RTL.
- **saved-products:** List of saved product slugs (SavedProductsContext); each fetches product by slug and shows card; tap to product.
- **talk-to-us:** Support / contact (e.g. link to WhatsApp or contact info); i18n.

### 14.3 Saved products (`contexts/SavedProductsContext.tsx`)

- **State:** Set of saved product slugs. Persisted (e.g. AsyncStorage).
- **API:** `toggleSaved(slug)`, `savedSlugs`, `isSaved(slug)`.
- **Usage:** Product detail save button; saved-products screen.

---

## 15. UI Building Blocks

### 15.1 Theme (`constants/theme.ts`, `constants/accountTheme.ts`)

- **Colors:** primary (pink), background, card, text, textMuted, border, success, error.
- **Spacing:** xs, sm, md, lg, xl.
- **Border radius:** sm, md, lg, full.
- **Typography / account:** Optional account-specific styles.

### 15.2 Images

- **OptimizedImage:** Wraps expo-image; supports `contentFit`, placeholder, `transition`, `cachePolicy`; used for product/collection images and logos.
- **AVIF:** Logo (wrapitup.avif) used in AnimatedSplash and AppHeaderTitle; expo-image supports AVIF.

### 15.3 Haptics (`lib/haptics.ts`)

- **hapticPrimary:** Light impact (e.g. button tap).
- **hapticImpact:** Medium impact (e.g. add to cart, save).
- **hapticSuccess:** Success notification (e.g. order placed, reward redeemed).
- **hapticError:** Error notification (e.g. payment failed).
- All respect system “reduce motion” and skip on web.

### 15.4 Formatting (`lib/format.ts`)

- **formatPrice(amount):** Returns `"EGP X"` with thousand separators, no trailing `.00` when integer.
- **formatNumber:** Thousand separators for points and other numbers.

### 15.5 Skeletons (`components/skeletons/`)

- Skeleton placeholders for home, product grid, product detail, collection, orders. Used while loading to avoid layout shift.

### 15.6 Other components

- **GlassyTabBar:** Custom floating tab bar (pill style).
- **AppHeaderTitle:** Centered logo in header.
- **HeaderRewardsButton:** Rewards icon in header; navigates to rewards or login.
- **SaveProductButton:** Heart icon to toggle saved state on product.
- **SlideToAdd:** Optional slide gesture to add to cart (if used on product screen).
- **Account components:** AccountListRow, AddressesSection, AddressFormModal, IdentityHeader, LanguageSection, PersonalInfoSection, SupportSection, etc.

---

## 16. API Integration (`lib/api.ts`)

- **Base URL:** `EXPO_PUBLIC_API_URL` (default `http://localhost:3001/api`).
- **Client:** Axios instance with JSON headers, no-cache headers, timeout.
- **Endpoints used:**  
  Auth (register).  
  Collections (list, by slug, homepage, navbar).  
  Homepage (active-hero, hero-text, app-settings).  
  Products (list, by slug, recommended at checkout, addons by product).  
  Delivery (time-slots, available-dates), delivery-destinations.  
  Promo codes (validate).  
  Orders (create, get by number).  
  Payments (create-intent — for future use).  
  Notifications (push-token registration).  
  Loyalty (balance, rewards, redeem).  
  Onboarding (config).
- **No auth token:** Orders are created with customer name/email/phone in the payload (guest-style). Supabase auth is for app session only (who is signed in).

---

## 17. Geocoding (`lib/geocoding.ts`)

- **Google Geocoding API:** Reverse geocoding (lat/lng → address). Used by delivery-address-map.
- **Helpers:** `buildMapsLink`, `buildFullAddress`; custom `GeocodingError` for API errors (e.g. REQUEST_DENIED). Requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` and Geocoding API enabled.

---

## 18. Push Notifications

- **Hook:** `usePushNotifications()` in root layout; requests permissions; on Android creates a default channel; in dev builds (not Expo Go) fetches Expo push token.
- **Registration:** Order confirmation screen can send the token to the backend (`registerPushToken(email, token)`) so the backend can send order confirmation pushes later.
- **Backend:** Can store tokens and send via Expo push API when an order is confirmed (e.g. COD or Stripe webhook).

---

## 19. Payment-Related Code (Current State)

- **Stripe:** StripeProvider wraps the app; `createPaymentIntent` and Stripe SDK are available but **not used** in the current “Place order” flow.
- **select-payment-method screen:** Exists and is registered in the Stack but **checkout does not navigate to it**. It would allow choosing Card/Apple Pay/InstaPay/COD and then confirm; current flow skips it.
- **CheckoutPaymentContext:** Still in the layout tree; used only if something navigates to select-payment-method. Checkout itself builds the order payload and calls `createOrder` with `payment_method: 'cod'` directly.

---

## 20. Data Sync With Admin

- **Refetch on focus:** Key screens (home, collections, collection detail, product, orders) refetch when they gain focus so admin changes (products, prices, collections, orders) appear without restarting the app.
- **Pull-to-refresh:** Home, collections, collection detail, product detail support pull-to-refresh.
- **No long-lived cache:** API client uses no-cache headers so data is fresh from the server.

---

## 21. Admin Panel & Website Controls

The admin panel is a **Next.js web application** (under `frontend/app/admin/`) that talks to the same NestJS backend. All admin routes are protected by **AdminGuard**: the user must be in the `admins` table in Supabase and sign in via `POST /admin/auth/login`. The session is stored in the browser (e.g. `local_token`); `GET /admin/auth/me` is used to verify the token on layout load. Below is what the admin can control and how it is implemented (backend + admin UI).

### 21.1 Admin authentication

- **Backend:** `POST /admin/auth/login` (email, password). Supabase sign-in; then lookup in `admins` table. If not an admin, returns 401. Returns user + session.
- **Guard:** `AdminGuard` checks the Bearer token (from session), decodes the user id, and calls `AdminService.verifyAdmin(userId)`. All admin endpoints use `@UseGuards(AdminGuard)` except login.
- **Frontend:** Login page at `/admin/login`; on success, session/token stored (e.g. in `localStorage` as `admin_token`). Layout calls `/admin/auth/me`; if it fails, redirects to `/admin/login`. Logout clears token and redirects to login.

### 21.2 Dashboard (`/admin`)

- **Backend:** No dedicated dashboard API; the dashboard page calls `GET /admin/products`, `GET /admin/collections`, `GET /admin/orders` and computes counts and total revenue (e.g. sum of `order.total` where `payment_status === 'paid'`).
- **Frontend:** Shows cards: Products count, Collections count, Orders count, Total revenue. Links to Manage Products, Manage Collections, View Orders.

### 21.3 Products (`/admin/products`, `/admin/products/[id]`)

- **Backend (AdminController):**
  - `GET /admin/products` — list all products (including inactive).
  - `GET /admin/products/:id` — one product by id.
  - `POST /admin/products` — create product (CreateProductDto).
  - `PATCH /admin/products/:id` — update product (UpdateProductDto, partial).
  - `DELETE /admin/products/:id` — soft delete or remove product.
- **Product fields (create/update):** `title`, `slug` (optional, can be auto-generated), `description`, `base_price`, `discount_price`, `stock_quantity`, `points_value`, `minimum_quantity` (optional, for minimum order qty), `is_active`, `show_in_all_collection`, `recommended_at_checkout` (for “People also like” in cart; backend may enforce max 4), `image_urls` (array), `variations` (array of variation name + options with label, price_modifier, stock_quantity, display_order).
- **Implementation:** Products live in `products` table; images in `product_images`; variations in `product_variations` and `product_variation_options`. Collection membership is via `collection_products` (many-to-many). Admin UI: list with search/filters; create/edit form with image upload (e.g. Supabase storage + crop), variation/addon management, checkboxes for show_in_all_collection and recommended_at_checkout.

### 21.4 Collections (`/admin/collections`, `/admin/collections/[id]`)

- **Backend (AdminController):**
  - `GET /admin/collections` — list all collections (including inactive).
  - `GET /admin/collections/:id` — one collection by id.
  - `POST /admin/collections` — create (CreateCollectionDto).
  - `PATCH /admin/collections/:id` — update (UpdateCollectionDto).
  - `PATCH /admin/collections/nav-order` — update navbar order (orderedIds).
  - `DELETE /admin/collections/:id` — remove collection.
- **Collection fields:** `name`, `slug`, `description`, `image_url`, `is_active`, `display_order`, `show_on_homepage`, `show_in_nav`, `product_ids` (for assigning products to the collection).
- **Implementation:** Stored in `collections` table; `collection_products` links collections to products with `display_order`. Homepage “featured collections” use `show_on_homepage`; navbar and app collection switcher use `show_in_nav`. Admin UI: list; create/edit form with image URL, product multi-select, and order.

### 21.5 Navbar collections (`/admin/navbar-collections`)

- **Backend:** Uses the same collections API; `updateNavOrder` updates `display_order` (or equivalent) so the order of collections in the website navbar and app is controlled.
- **Frontend:** Page to reorder which collections appear in the nav (and in the app collections tab).

### 21.6 Add-ons (`/admin/addons`, `/admin/addons/[id]`)

- **Backend (AddonsController, admin-only for write):**
  - `GET /addons` — list add-ons (query `includeInactive=true` for admin).
  - `GET /addons/product/:productId` — add-ons linked to a product (public for product page).
  - `GET /addons/:id` — one addon.
  - `POST /addons`, `PATCH /addons/:id`, `DELETE /addons/:id` — create, update, remove (AdminGuard).
- **Addon fields:** Name, price, optional image, display order, is_active; linked to products via a join table (e.g. `product_addons`).
- **Frontend:** List add-ons; create/edit form; assign add-ons to products. Product detail in app fetches add-ons by product id.

### 21.7 Orders (`/admin/orders`)

- **Backend (AdminController):**
  - `GET /admin/orders` — list orders with optional filters: `status`, `paymentStatus`, `deliveryDate`, `startDate`, `endDate`.
  - `GET /admin/orders/:id` — full order with items (order_items).
  - `PATCH /admin/orders/:id/status` — update `order_status` (e.g. pending, preparing, out_for_delivery, delivered).
- **Implementation:** Orders and order_items in DB; payment_status can be `pending`, `paid`, `PENDING_CASH`, `failed`, etc. Admin sees customer name, email, phone, delivery date/time, address, payment method, payment status, items, totals, points earned. Refunds/cancellations are noted as manual (e.g. via WhatsApp/Instagram); changing status does not call Stripe refund automatically.
- **Frontend:** Orders list with filters (order status, payment status); order detail view; dropdown to change order status.

### 21.8 Delivery settings (`/admin/delivery-settings`)

- **Backend (DeliveryController, under `/delivery`):**
  - **Public:** `GET /delivery/time-slots`, `GET /delivery/available-dates?startDate&endDate`, `GET /delivery/check-availability/:date`.
  - **Admin – delivery days:**
    - `GET /delivery/admin/delivery-days?startDate&endDate` — list delivery days in range.
    - `GET /delivery/admin/delivery-days/:id`, `POST /delivery/admin/delivery-days`, `PUT /delivery/admin/delivery-days/:id`, `PUT /delivery/admin/delivery-days/date/:date` — get, create, update by id or by date.
    - `POST /delivery/admin/delivery-days/bulk` — bulk update (e.g. mark many dates unavailable).
    - `DELETE /delivery/admin/delivery-days/:id`, `POST /delivery/admin/delivery-days/reset` — delete, reset.
  - **Admin – time slots:**
    - `GET /delivery/admin/time-slots`, `GET /delivery/admin/time-slots/:id`, `POST /delivery/admin/time-slots`, `PUT /delivery/admin/time-slots/:id`, `DELETE /delivery/admin/time-slots/:id`, `POST /delivery/admin/time-slots/reorder` (body: `slotIds`).
- **Delivery day fields:** `date`, `status` (e.g. available, fully_booked, unavailable), `capacity`, `admin_note`. Triggers or service logic update `current_orders` when orders are paid.
- **Time slot fields:** `label`, `start_time`, `end_time`, `is_active`, `display_order`.
- **Frontend:** Two tabs: Delivery days (calendar/range view, set status/capacity per date, bulk mark unavailable) and Time slots (list, add/edit/delete/reorder slots). These drive what the app shows for “delivery date” and “time slot” in checkout.

### 21.9 Delivery destinations (`/admin/delivery-destinations`)

- **Backend (AdminController):**
  - `GET /admin/delivery-destinations`, `GET /admin/delivery-destinations/:id`, `POST /admin/delivery-destinations`, `PATCH /admin/delivery-destinations/:id`, `DELETE /admin/delivery-destinations/:id`.
- **Body:** `name`, `fee_egp`, `display_order`, `is_active`.
- **Implementation:** Stored in `delivery_destinations`. App checkout loads them and shows destination selector; selected `delivery_destination_id` and `fee_egp` are sent with the order.
- **Frontend:** List; add/edit/delete destinations with name and fee.

### 21.10 Promo codes (`/admin/promo-codes`)

- **Backend (PromoCodesController):**
  - **Public:** `POST /promo-codes/validate` (code, subtotal_egp) — returns discount_amount_egp and promo_code_id for checkout.
  - **Admin:** `GET /promo-codes`, `GET /promo-codes/:id`, `POST /promo-codes`, `PATCH /promo-codes/:id`, `DELETE /promo-codes/:id`.
- **Fields:** Code, discount type/amount, validity dates, usage limit, etc. (see CreatePromoCodeDto / UpdatePromoCodeDto).
- **Frontend:** List promo codes; create/edit (set code, discount, validity, limits).

### 21.11 Points & rewards (`/admin/rewards`, `/admin/rewards/[id]`)

- **Backend (AdminController):**
  - `GET /admin/rewards`, `GET /admin/rewards/:id`, `POST /admin/rewards`, `PATCH /admin/rewards/:id`, `DELETE /admin/rewards/:id`.
- **Reward DTO:** `title`, `description`, `points_required`, `image_url`, `is_active`.
- **Implementation:** Loyalty service grants points on order finalization (by email); rewards are redeemed in the app (POST /loyalty/redeem). Admin manages the list of rewards and points required.
- **Frontend:** List rewards; create/edit reward (title, description, points required, image, active).

### 21.12 Homepage / app hero & app settings (`/admin/homepage`)

- **Backend (AdminHomepageController, under `/admin/homepage`):**
  - **Hero images:** `GET /admin/homepage/hero-images`, `POST /admin/homepage/hero-images` (image_url, set_as_active), `PATCH /admin/homepage/hero-images/:id/set-active`, `DELETE /admin/homepage/hero-images/:id`.
  - **Hero text:** `GET /admin/homepage/hero-text`, `PATCH /admin/homepage/hero-text` (headline, subtext, button_label).
  - **App settings:** `GET /admin/homepage/app-settings`, `PATCH /admin/homepage/app-settings` (home_section_order, promotion_visible, promotion_title, promotion_message, final_cta_headline, final_cta_subtext, final_cta_button, featured_products_limit).
- **Implementation:**
  - **Hero images:** Table `homepage_hero_images` (id, image_url, is_active, created_at). Only one is active; used by website and app hero.
  - **Hero text:** Table `homepage_hero_text` (headline, subtext, button_label). Used by app (and optionally website) hero section.
  - **App settings:** Table `app_settings` (key-value). Keys: `home_section_order` (array of section ids), `promotion_visible`, `promotion_title`, `promotion_message`, `final_cta_headline`, `final_cta_subtext`, `final_cta_button`, `featured_products_limit`. The **mobile app** fetches these via public `GET /homepage/active-hero`, `GET /homepage/hero-text`, `GET /homepage/app-settings` (no admin prefix) to build the home screen (section order, promotion block, final CTA, featured products limit).
- **Frontend:** Single page: list hero images, upload new image (e.g. Supabase + crop), set active; edit hero text (headline, subtext, button label); edit app settings (section order drag-and-drop, promotion toggle and text, final CTA text, featured products limit). Changes are reflected in the app on next fetch (focus or refresh).

### 21.13 Analytics (`/admin/analytics`)

- **Backend (AnalyticsController):**
  - **Public (tracking):** `POST /analytics/track/product-click`, `POST /analytics/track/session` (product_id, session_id, etc.).
  - **Admin:** `GET /analytics/product-clicks`, `GET /analytics/daily-users?timeRange`, `GET /analytics/live-users?activeSeconds`, `GET /analytics/conversion-counts`, `GET /analytics/best-selling-products`, `GET /analytics/sales-summary`, `GET /analytics/peak-order-hours` (with optional timeRange, startDate, endDate).
- **Implementation:** Analytics service writes/reads from Supabase (or dedicated analytics tables); product clicks and sessions for dashboards; order-based metrics for sales and conversions.
- **Frontend:** Dashboard with charts/tables for product clicks, daily users, live users, conversion counts, best-selling products, sales summary, peak order hours.

### 21.14 Onboarding (mobile app)

- **Backend:** The mobile app calls `GET /onboarding/config`. If this endpoint exists, it can return `{ enabled: boolean, slides: { title, subtitle, order }[] }`. If not implemented, the app uses a default (e.g. enabled: false, slides: []).
- **Admin:** There is no dedicated onboarding admin page in the list; onboarding config could be added under homepage or a separate “Onboarding” page (enable/disable, manage slides). Documented here for completeness.

### 21.15 Database / backend summary

- **Tables relevant to admin:** `admins`, `products`, `product_images`, `product_variations`, `product_variation_options`, `collections`, `collection_products`, `orders`, `order_items`, `delivery_destinations`, `delivery_days`, `delivery_time_slots`, `homepage_hero_images`, `homepage_hero_text`, `app_settings`, `promo_codes`, `loyalty_rewards`, `product_addons` (or equivalent), analytics tables. Orders also have `payment_method`, `payment_status` (e.g. PENDING_CASH, paid).
- **Mail & notifications:** On order finalization (e.g. COD or Stripe webhook), the backend sends confirmation email (Resend) and can send an Expo push notification if a token was registered for the customer email.

### 21.16 How mobile app uses admin-controlled data

| Admin control | Where it appears in the app |
|---------------|-----------------------------|
| Hero image + hero text | Home screen hero section |
| App settings (section order, promotion, final CTA, featured limit) | Home screen layout and content |
| Collections (show_on_homepage, show_in_nav) | Home featured collections; Collections tab switcher |
| Collections + collection_products | Collection detail screen and product grid |
| Products (incl. variations, add-ons, show_in_all_collection, recommended_at_checkout) | Product detail; “People also like” in cart; “All” collection |
| Delivery days + time slots | Checkout: date chips and time slot chips |
| Delivery destinations | Checkout: destination selector and fee |
| Promo codes | Checkout: apply code and discount |
| Orders (create/update) | Order confirmation; Past orders list; Admin orders list |
| Rewards | Rewards tab: list and redeem |

---

## 22. Summary Table

| Area              | Features / implementation |
|-------------------|----------------------------|
| **Launch**        | Native splash → auth ready → AnimatedSplash (pink + logo) → main app |
| **i18n & RTL**    | English & Arabic; all UI via `t(language, key)`; RTL for Arabic |
| **Auth**          | Supabase; login/register; session restore; optional guards |
| **Home**          | Configurable sections: hero, featured collections/products, promotion, value prop, final CTA |
| **Collections**   | Tab with collection switcher; collection detail with hero, filter/sort row, product grid |
| **Product**       | Detail with variations, add-ons, quantity, add to cart, save; haptics; optional add-on modal |
| **Cart**          | Persisted in AsyncStorage; summary; “People also like”; proceed to checkout |
| **Checkout**      | Full form (customer, date, time, destination, address, map picker, promo, message); Place order → create order (COD) → order confirmation |
| **Delivery map**  | Map picker; reverse geocoding; save address / set pending for checkout |
| **Order**         | Create with payment_method COD; confirmation screen; order number saved; cart cleared on confirmation; points refetched |
| **Past orders**   | List from AsyncStorage order numbers + API; payment status badge; pull-to-refresh |
| **Rewards**       | Balance; list rewards; redeem (signed-in); i18n |
| **Account**       | Profile, orders, saved products, language, support, log out |
| **Saved products** | Persisted slugs; list screen; toggle from product detail |
| **Payments**      | No payment UI in current flow; Stripe and select-payment-method exist but unused in checkout |
| **Admin panel**   | Next.js admin at `/admin/*`: auth, dashboard, products, collections, navbar, add-ons, orders, delivery settings & destinations, promo codes, rewards, homepage/hero/app-settings, analytics; all backed by NestJS admin APIs and AdminGuard (see §21). |

This document reflects the codebase as of the last review; any later change to flows (e.g. re-enabling payment method selection) would need a small update to sections 10 and 19.
