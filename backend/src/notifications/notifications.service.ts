import { Injectable } from '@nestjs/common';

/** In-memory store: email -> Expo push token. For production, persist in DB. */
const tokenStore = new Map<string, string>();

@Injectable()
export class NotificationsService {
  registerPushToken(email: string, token: string): void {
    if (email?.trim() && token?.trim()) {
      tokenStore.set(email.trim().toLowerCase(), token.trim());
    }
  }

  /** Send order confirmation push if we have a token for this email. */
  async sendOrderConfirmationPush(customerEmail: string, orderNumber: string): Promise<boolean> {
    const token = customerEmail?.trim() ? tokenStore.get(customerEmail.trim().toLowerCase()) : null;
    if (!token) return false;
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title: 'Order confirmed',
          body: `Your order ${orderNumber} has been confirmed.`,
          data: { orderNumber, screen: 'order-confirmation' },
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[Notifications] Expo push failed:', e);
      return false;
    }
  }
}
