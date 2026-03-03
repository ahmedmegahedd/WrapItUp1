import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Mobile app uses the same backend API as the website and admin panel.
 * Changes made in the admin panel (products, collections, orders, etc.) are
 * stored in the same database; the app always fetches fresh data when
 * screens gain focus and supports pull-to-refresh, so admin updates appear
 * automatically without caching stale data.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  return config;
});

/** Register new user (email, password, phone required). Backend creates Supabase user + profile. */
export async function registerAccount(payload: {
  email: string;
  password: string;
  full_name?: string;
  phone: string;
}): Promise<void> {
  await api.post('/auth/register', payload);
}

export async function getCollections(includeInactive = false, homepageOnly = false): Promise<any[]> {
  const { data } = await api.get('/collections', {
    params: {
      includeInactive: includeInactive ? 'true' : undefined,
      homepageOnly: homepageOnly ? 'true' : undefined,
    },
  });
  return (data || [])
    .filter((c: any) => includeInactive || c.is_active)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/** Collections to show on homepage (show_on_homepage = true). */
export async function getHomepageCollections(): Promise<any[]> {
  return getCollections(false, true);
}

/** Collections to show in the app navbar (show_in_nav !== false). Same as website dropdown. */
export async function getNavbarCollections(): Promise<any[]> {
  const list = await getCollections(false);
  return list.filter((c: any) => c.show_in_nav !== false);
}

/** Active hero image URL for the app home hero (admin-controlled). */
export async function getActiveHeroImage(): Promise<{ image_url: string } | null> {
  const { data } = await api.get<{ image_url: string } | null>('/homepage/active-hero');
  return data ?? null;
}

/** Hero headline, subtext, and button label for the app (admin-controlled). */
export async function getHeroText(): Promise<{
  headline: string;
  subtext: string;
  button_label: string;
}> {
  const { data } = await api.get<{ headline?: string; subtext?: string; button_label?: string }>('/homepage/hero-text');
  return {
    headline: data?.headline ?? '',
    subtext: data?.subtext ?? '',
    button_label: data?.button_label ?? '',
  };
}

export interface AppSettings {
  home_section_order: string[];
  promotion_visible: boolean;
  promotion_title: string;
  promotion_message: string;
  final_cta_headline: string;
  final_cta_subtext: string;
  final_cta_button: string;
  featured_products_limit: number;
}

/** App home screen settings (section order, promotion, final CTA, featured limit). */
export async function getAppSettings(): Promise<AppSettings> {
  const { data } = await api.get<AppSettings>('/homepage/app-settings');
  const defaultOrder = [
    'hero',
    'featured_collections',
    'featured_products',
    'promotion',
    'value_proposition',
    'final_cta',
  ];
  return {
    home_section_order: Array.isArray(data?.home_section_order) ? data.home_section_order : defaultOrder,
    promotion_visible: data?.promotion_visible !== false,
    promotion_title: data?.promotion_title ?? 'Special offer',
    promotion_message: data?.promotion_message ?? 'Free delivery on orders over 250 EGP',
    final_cta_headline: data?.final_cta_headline ?? 'Ready to surprise someone?',
    final_cta_subtext: data?.final_cta_subtext ?? 'Browse our collections and order in minutes.',
    final_cta_button: data?.final_cta_button ?? 'Browse all collections',
    featured_products_limit:
      typeof data?.featured_products_limit === 'number' ? data.featured_products_limit : 8,
  };
}

export async function getProducts(
  includeInactive = false,
  showInAllCollection = false,
): Promise<any[]> {
  const { data } = await api.get('/products', {
    params: {
      includeInactive: includeInactive ? 'true' : undefined,
      showInAllCollection: showInAllCollection ? 'true' : undefined,
    },
  });
  return (data || []).filter((p: any) => includeInactive || p.is_active !== false);
}

/** Up to 4 products for "People also like" in cart (admin-selected). */
export async function getRecommendedAtCheckout(): Promise<any[]> {
  const { data } = await api.get('/products/recommended/checkout');
  return Array.isArray(data) ? data : [];
}

export async function getCollectionBySlug(slug: string): Promise<any> {
  const { data } = await api.get(`/collections/slug/${slug}`);
  return data;
}

export async function getProductBySlug(slug: string): Promise<any> {
  const { data } = await api.get(`/products/slug/${slug}`);
  return data;
}

export async function getProductAddons(productId: string): Promise<any[]> {
  const { data } = await api.get(`/addons/product/${productId}`);
  return data || [];
}

export async function getTimeSlots(): Promise<any[]> {
  const { data } = await api.get('/delivery/time-slots');
  return (data || []).filter((s: any) => s.is_active !== false);
}

/** Normalize a date from API (string or ISO) to YYYY-MM-DD. */
function toDateString(d: string | Date): string {
  if (typeof d === 'string') return d.split('T')[0];
  return d.toISOString().split('T')[0];
}

export async function getAvailableDates(startDate: string, endDate: string): Promise<any[]> {
  const { data } = await api.get('/delivery/available-dates', {
    params: { startDate, endDate },
  });
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: any) => ({
    ...row,
    date: toDateString(row.date),
    status: row.status ?? 'available',
  }));
}

export async function getDeliveryDestinations(): Promise<any[]> {
  const { data } = await api.get('/delivery-destinations');
  return data || [];
}

export async function validatePromoCode(code: string, subtotalEgp: number): Promise<{ discount_amount_egp: number; promo_code_id: string }> {
  const { data } = await api.post('/promo-codes/validate', { code, subtotal_egp: subtotalEgp });
  return data;
}

export async function createOrder(payload: any): Promise<any> {
  const { data } = await api.post('/orders', payload);
  return data;
}

/** Paymob: initiate card payment; returns payment key token and Paymob order id for WebView. */
export async function initiatePaymobPayment(
  amountEGP: number,
  orderId: string,
  customerInfo: { firstName: string; lastName: string; email: string; phone: string },
): Promise<{ paymentKeyToken: string; paymobOrderId: string }> {
  const { data } = await api.post('/payments/initiate', {
    amountEGP,
    orderId,
    customerInfo,
  });
  return data;
}

export async function getOrderByNumber(orderNumber: string): Promise<any> {
  const { data } = await api.get(`/orders/number/${orderNumber}`);
  return data;
}

/** Register Expo push token for order confirmation notifications (optional). */
export async function registerPushToken(email: string, token: string): Promise<void> {
  await api.post('/notifications/push-token', { email: email.trim(), token: token.trim() });
}

/** Loyalty: get points balance by customer email. */
export async function getLoyaltyBalance(email: string): Promise<{ points_balance: number }> {
  if (!email?.trim()) return { points_balance: 0 };
  const { data } = await api.get('/loyalty/balance', { params: { email: email.trim() } });
  return data ?? { points_balance: 0 };
}

/** Loyalty: list active rewards. */
export async function getRewards(): Promise<any[]> {
  const { data } = await api.get('/loyalty/rewards');
  return data ?? [];
}

/** Loyalty: redeem a reward (phase-ready). */
export async function redeemReward(email: string, rewardId: string): Promise<{ points_balance: number }> {
  const { data } = await api.post('/loyalty/redeem', { email: email.trim(), reward_id: rewardId });
  return data;
}

/** Onboarding: config from admin (enable/disable, slides). Graceful fallback on failure. */
export interface OnboardingSlide {
  id?: string;
  title: string;
  subtitle: string;
  order?: number;
}

export interface OnboardingConfig {
  enabled: boolean;
  slides: OnboardingSlide[];
}

const DEFAULT_ONBOARDING: OnboardingConfig = {
  enabled: false,
  slides: [],
};

export async function getOnboardingConfig(): Promise<OnboardingConfig> {
  try {
    const { data } = await api.get<OnboardingConfig>('/onboarding/config');
    if (data && typeof data.enabled === 'boolean' && Array.isArray(data.slides)) {
      const slides = data.slides
        .filter((s: any) => s && (s.title != null || s.subtitle != null))
        .map((s: any) => ({ title: String(s.title ?? ''), subtitle: String(s.subtitle ?? ''), order: s.order ?? 0 }))
        .sort((a: OnboardingSlide, b: OnboardingSlide) => (a.order ?? 0) - (b.order ?? 0));
      return { enabled: data.enabled && slides.length > 0, slides };
    }
  } catch (_) {}
  return DEFAULT_ONBOARDING;
}

/** Track that the user started checkout (for abandoned-checkout analytics). Call when checkout screen is opened. */
export async function trackStartCheckout(payload: {
  user_id?: string | null;
  cart_value: number;
}): Promise<void> {
  try {
    await api.post('/analytics/track/start-checkout', {
      user_id: payload.user_id ?? undefined,
      cart_value: payload.cart_value,
    });
  } catch (_) {
    // Non-blocking; analytics failures should not affect checkout
  }
}
