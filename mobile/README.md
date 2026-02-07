# Wrap It Up — Mobile App (Expo)

React Native (Expo) mobile app that consumes the existing NestJS API. Admin remains web-only.

## Features

- **Supabase auth** — Sign in / Sign up with email
- **Browse** — Home, collections, collection detail, product detail (with variations & add-ons)
- **Cart** — Add/remove/quantity; persists in AsyncStorage
- **Checkout** — Delivery date, time slot, destination, full address, Google Maps link, promo code, card message
- **Stripe** — Payment via Stripe React Native SDK (Payment Sheet)
- **Order confirmation** — Success screen and order number saved for history
- **Order history** — List of past orders (by order number)
- **Push notifications** — Expo Notifications (token registered on launch)

## Setup

1. **Install dependencies**

   ```bash
   cd mobile && npm install
   ```

2. **Environment (required for login/register)**

   Copy `env.example` to `.env` in the `mobile` folder and set:

   - `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — From your Supabase project: **Settings → API** (URL and anon/public key). Without these, you’ll see “Supabase not configured” when signing in or up.
   - `EXPO_PUBLIC_API_URL` — NestJS API base URL. Use your machine IP (e.g. `http://192.168.1.1:3001/api`) for a physical device or emulator; `localhost` only works in simulator with port forwarding.
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (e.g. `pk_test_...`) for checkout.

   Restart the dev server after changing `.env`: `npx expo start`.

3. **Assets**

   Add under `mobile/assets/`:

   - `icon.png` (1024×1024) — App icon
   - `splash-icon.png` — Splash screen image
   - `adaptive-icon.png` (1024×1024) — Android adaptive icon
   - `notification-icon.png` (96×96) — Optional; for notification icon on Android

   Or run `npx expo prebuild` and replace the default assets.

4. **Run**

   ```bash
   npx expo start
   ```

   Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go on a device (ensure device and dev machine are on the same network and `EXPO_PUBLIC_API_URL` uses the machine IP).

## Project structure

- `app/` — Expo Router screens (auth, tabs, collection, product, checkout, order-confirmation)
- `components/` — Reusable UI (extend as needed)
- `contexts/` — AuthContext (Supabase), CartContext (AsyncStorage)
- `lib/` — `api.ts` (NestJS client), `supabase.ts` (auth client)
- `hooks/` — `usePushNotifications.ts` (Expo Notifications)
- `constants/theme.ts` — Colors and spacing
- `types/api.ts` — Shared API types

## API usage

The app uses the same public endpoints as the web frontend:

- `GET /collections`, `GET /collections/slug/:slug`
- `GET /products/slug/:slug`
- `GET /addons/product/:productId`
- `GET /delivery/time-slots`, `GET /delivery/available-dates`
- `GET /delivery-destinations`
- `POST /promo-codes/validate`
- `POST /orders`, `POST /payments/create-intent`
- `GET /orders/number/:orderNumber`

No admin or auth token is sent; order creation is guest-style (customer name/email/phone in payload). Supabase auth is used only for app session (who is signed in).

## Admin panel sync

The app reads from the **same backend API** as the website and admin panel. Changes made in the admin (products, collections, add-ons, order status, delivery options, etc.) are stored in the same database and **automatically appear in the app**:

- **Refetch on focus** — When a user navigates to a screen (Home, Collections, a collection, a product, Orders), the app fetches fresh data from the API so admin updates are shown without restarting the app.
- **Pull-to-refresh** — Home, Collections, collection detail, and product detail support pull-to-refresh so users can manually refresh to see the latest data.
- **No long-lived caching** — API requests use cache-control headers so responses are not cached; each fetch gets current data from the server.

## Push notifications

Expo push token is requested on app launch. To send notifications (e.g. order updates), store the token on your backend and use Expo’s push API or a service that supports Expo (e.g. OneSignal, Firebase). The token is available in the app via `usePushNotifications()`; you can POST it to a backend endpoint when the user is signed in.

## Currency

All amounts are in EGP (Egyptian Pounds), displayed as “E£ X.XX”.
