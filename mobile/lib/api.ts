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

export async function getProducts(includeInactive = false): Promise<any[]> {
  const { data } = await api.get('/products', {
    params: { includeInactive: includeInactive ? 'true' : undefined },
  });
  return (data || []).filter((p: any) => includeInactive || p.is_active !== false);
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

export async function getAvailableDates(startDate: string, endDate: string): Promise<any[]> {
  const { data } = await api.get('/delivery/available-dates', {
    params: { startDate, endDate },
  });
  return data || [];
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

export async function createPaymentIntent(orderId: string, amount: number): Promise<{ clientSecret: string; id?: string }> {
  const { data } = await api.post('/payments/create-intent', { orderId, amount });
  return data;
}

export async function getOrderByNumber(orderNumber: string): Promise<any> {
  const { data } = await api.get(`/orders/number/${orderNumber}`);
  return data;
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
