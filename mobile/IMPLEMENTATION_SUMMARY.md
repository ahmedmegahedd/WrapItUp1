# Mobile App — Implementation Summary

A concise summary of the features and changes implemented in the Wrap It Up mobile application (Expo / React Native).

---

## 1. Animated splash screen

**Goal:** A branded launch experience: pink screen first, then the logo appears with a short animation, then a smooth exit into the app.

- **Initial state:** Logo is not visible on first paint (opacity 0, scale 0.6). Only the brand-pink full-screen overlay is shown.
- **Intro delay:** ~200 ms with only the pink background; no logo flash before the animation starts.
- **Logo entrance:** Opacity 0 → 1 over ~650 ms; scale 0.6 → 1.08 → 1.0 (timing, not spring). Feels slower and more controlled.
- **Exit:** After the logo settles, ~200 ms pause, then overlay fades out over ~400 ms and logo scales to 0.96. `onFinish()` is called when the exit animation completes.
- **Reduce motion:** If the system “reduce motion” setting is enabled, all delays and animations are skipped and `onFinish()` is called immediately; the overlay and logo are not rendered.
- **Implementation detail:** `onFinish` is kept in a ref so the animation effect does not re-run on parent re-renders, ensuring the intro timer fires and the logo actually appears.

**Files:** `components/AnimatedSplash.tsx`, used from `components/SplashGate.tsx` and `app/_layout.tsx`.

---

## 2. Navigation and header

- **Back button label:** The root stack uses `headerBackTitle: '< back'` so screens that show a back button (e.g. collection, product, checkout) display “< back” instead of “(tabs)” when coming from the tab stack.
- **Tabs:** Bottom tab bar (GlassyTabBar) shows Home, Collections, Cart, and Account (Rewards and Orders are hidden from the bar but reachable from Account). Header shows centered logo and rewards button.

**Files:** `app/_layout.tsx` (stack `screenOptions`), `app/(tabs)/_layout.tsx`, `components/GlassyTabBar.tsx`.

---

## 3. Collections tab and tab bar overlap

- **Collections list:** The Collections tab shows all active collections (from the API). There is no separate “navbar” dropdown in the header; Seasonal Gifts and other collections are reached only via this list.
- **Tab bar overlap:** The last collection in the list was sometimes covered by the bottom tab bar. The Collections screen now sets the list’s bottom padding dynamically using safe area insets plus the tab bar pill height (~56 px) so the last item stays visible above the bar on all devices.

**Files:** `app/(tabs)/collections.tsx` (useSafeAreaInsets + `contentContainerStyle` paddingBottom).

---

## 4. Hero section driven by admin

**Goal:** The home hero (image and text) is fully controlled from the admin panel, not hardcoded.

- **Data source:** The app calls the same APIs used by the admin UI:
  - `GET /homepage/active-hero` → active hero image URL
  - `GET /homepage/hero-text` → headline, subtext, button label
- **Behaviour:** On home focus, the hero fetches these and renders the admin-configured image and text. If no image is set, a brand-primary placeholder is shown. If text is missing, the app falls back to i18n strings (e.g. `heroHeadline`, `heroSubtext`, `heroCta`).
- **API helpers:** `getActiveHeroImage()` and `getHeroText()` in `lib/api.ts`. Hero section uses `useFocusEffect` to refetch when the home screen is focused.

**Files:** `lib/api.ts`, `components/home/HeroSection.tsx`.

---

## 5. App home screen controlled by admin

**Goal:** Let the admin control more of the app home screen: section order/visibility, promotion banner, final CTA block, and featured products count.

- **Backend:** Public endpoint `GET /homepage/app-settings` returns:
  - `home_section_order` — ordered list of section ids (e.g. `hero`, `featured_collections`, `featured_products`, `promotion`, `value_proposition`, `final_cta`). Only sections in this list are shown, in this order.
  - `promotion_visible`, `promotion_title`, `promotion_message` — whether the promotion banner is shown and its copy.
  - `final_cta_headline`, `final_cta_subtext`, `final_cta_button` — copy for the final CTA block.
  - `featured_products_limit` — number of products in the “Best sellers” strip (e.g. 8).
- **Mobile usage:**
  - **Section order:** The home screen no longer uses a hardcoded section list. It uses `useAppSettings()` and renders only the sections in `home_section_order`, in that order.
  - **Promotion:** `PromotionSection` receives `visible`, `title`, and `message` from app settings; it hides when `visible` is false and uses admin text with i18n fallbacks.
  - **Final CTA:** `FinalCTASection` receives `headline`, `subtext`, and `buttonLabel` from app settings, with i18n fallbacks.
  - **Featured products:** `useHomeData({ featuredLimit })` uses `featured_products_limit` from app settings so the “Best sellers” row length is admin-configurable.
- **Hook:** `useAppSettings()` in `hooks/useAppSettings.ts` fetches app settings when the home screen is focused and returns them (or defaults) so the UI and data hooks stay in sync.

**Files:**  
- Backend: `backend/supabase/app-settings-schema.sql`, `backend/src/homepage/homepage.service.ts`, `homepage.controller.ts`, `admin-homepage.controller.ts`.  
- Mobile: `lib/api.ts` (`getAppSettings`, `AppSettings` type), `hooks/useAppSettings.ts`, `app/(tabs)/index.tsx`, `components/home/PromotionSection.tsx`, `components/home/FinalCTASection.tsx`, `hooks/useHomeData.ts`.

---

## 6. Other mobile behaviour (for context)

- **Auth and splash:** `SplashGate` waits for auth to be ready, then hides the native splash and shows `AnimatedSplash` once; `onFinish` sets the phase to `done` so the overlay is not shown again.
- **Collections and products:** Fetched from the same backend as the admin (collections, products, navbar collections helper available in API). Home “featured” collections use `show_on_homepage`; the Collections tab lists all active collections.
- **i18n:** Copy that is not overridden by admin (e.g. section titles, value props, empty states) still comes from `lib/i18n.ts` (EN/AR).

---

## Summary table

| Area              | What’s implemented                                                                 |
|-------------------|-------------------------------------------------------------------------------------|
| Splash            | Pink-first animated splash, logo animation, reduce motion, stable timers           |
| Navigation        | “< back” label; no header Collections dropdown; tab bar doesn’t cover last row      |
| Hero              | Image and text from admin via `/homepage/active-hero` and `/homepage/hero-text`    |
| Home layout       | Section order and visibility from admin `app-settings`                             |
| Promotion / CTA   | Visibility and copy from admin `app-settings` with i18n fallbacks                  |
| Featured products | Count from admin `featured_products_limit` in `app-settings`                       |

All of the above are implemented in the mobile app and, where applicable, controlled from the admin panel (hero + app settings).
