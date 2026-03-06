import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OrderConfirmationData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_date: string;
  delivery_time_slot: string;
  delivery_destination_name?: string;
  delivery_address?: string;
  delivery_maps_link?: string;
  items: Array<{
    product_title: string;
    quantity: number;
    selected_variations?: Record<string, string>;
    selected_addons?: Array<{ name: string; price: number }>;
    line_total: number;
  }>;
  subtotal_egp: number;
  discount_amount_egp?: number;
  delivery_fee_egp?: number;
  total_egp: number;
}

@Injectable()
export class MailService {
  private resend: any = null;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Resend } = require('resend');
        this.resend = new Resend(apiKey);
      } catch (e) {
        console.warn('Resend not available. Install: npm install resend');
      }
    }
    this.fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL') || 'orders@wrapitup.com';
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'Wrap It Up';
  }

  private buildOrderConfirmationHtml(data: OrderConfirmationData): string {
    const formatEgp = (n: number) => `E£ ${Number(n).toFixed(2)}`;
    const itemsRows = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${item.product_title} × ${item.quantity}
          ${item.selected_variations && Object.keys(item.selected_variations).length ? `<br><small>${Object.entries(item.selected_variations).map(([k, v]) => `${k}: ${v}`).join(', ')}</small>` : ''}
          ${item.selected_addons?.length ? `<br><small>Add-ons: ${item.selected_addons.map((a) => a.name).join(', ')}</small>` : ''}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatEgp(item.line_total)}</td>
      </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Order Confirmed</h1>
    <p style="margin: 8px 0 0; opacity: 0.95;">Thank you for your order!</p>
  </div>
  <div style="background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <p><strong>Order number:</strong> ${data.order_number}</p>
    <p><strong>Customer:</strong> ${data.customer_name}</p>
    <p><strong>Delivery date:</strong> ${data.delivery_date}</p>
    <p><strong>Delivery time:</strong> ${data.delivery_time_slot}</p>
    ${data.delivery_destination_name ? `<p><strong>Destination:</strong> ${data.delivery_destination_name}</p>` : ''}
    ${data.delivery_address ? `<p><strong>Delivery address:</strong><br>${data.delivery_address.replace(/\n/g, '<br>')}</p>` : ''}
    ${data.delivery_maps_link ? `<p><strong>Maps link:</strong> <a href="${data.delivery_maps_link}">${data.delivery_maps_link}</a></p>` : ''}

    <h3 style="margin-top: 24px;">Order items</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsRows}
    </table>

    <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #eee;">
      ${data.discount_amount_egp != null && data.discount_amount_egp > 0 ? `<p style="margin: 4px 0;">Subtotal: ${formatEgp(data.subtotal_egp)}</p><p style="margin: 4px 0;">Discount: -${formatEgp(data.discount_amount_egp)}</p>` : ''}
      ${data.delivery_fee_egp != null && data.delivery_fee_egp > 0 ? `<p style="margin: 4px 0;">Delivery: ${formatEgp(data.delivery_fee_egp)}</p>` : ''}
      <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold;">Total: ${formatEgp(data.total_egp)}</p>
    </div>

    <p style="margin-top: 28px; padding: 16px; background: #fef3c7; border-radius: 8px; font-size: 14px;">
      <strong>Refunds:</strong> Any refund request must be made via WhatsApp or Instagram DMs. Refunds are handled manually.
    </p>
  </div>
  <p style="text-align: center; color: #888; font-size: 12px; margin-top: 24px;">Wrap It Up — Luxury breakfast gifts</p>
</body>
</html>`;
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    if (!this.resend) {
      console.log('[Mail] Resend not configured. Order confirmation (no email sent):', data.order_number);
      return false;
    }
    try {
      const html = this.buildOrderConfirmationHtml(data);
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.customer_email,
        subject: `Order Confirmed — ${data.order_number}`,
        html,
      });
      return true;
    } catch (err) {
      console.error('[Mail] Failed to send order confirmation:', err);
      return false;
    }
  }

  async sendProductPendingReview(params: {
    to: string;
    productName: string;
    brandName: string;
    priceEgp: number;
    adminProductUrl: string;
  }): Promise<boolean> {
    if (!this.resend) {
      console.log('[Mail] Resend not configured. Product pending review (no email sent):', params.productName);
      return false;
    }
    try {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Product Pending Review</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 22px;">New product pending review</h1>
  </div>
  <div style="background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <p>Collaborator <strong>${params.brandName}</strong> has submitted a new product for review.</p>
    <p><strong>Product:</strong> ${params.productName}<br><strong>Price:</strong> E£ ${Number(params.priceEgp).toFixed(2)}</p>
    <p><a href="${params.adminProductUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View in admin</a></p>
  </div>
</body>
</html>`;
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject: `New product pending review: ${params.productName}`,
        html,
      });
      return true;
    } catch (err) {
      console.error('[Mail] Failed to send product pending review:', err);
      return false;
    }
  }
}
