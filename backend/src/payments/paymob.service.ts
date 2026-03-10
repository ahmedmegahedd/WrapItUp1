/**
 * PAYMOB PAYMENT SERVICE
 * Status: Architecture complete — awaiting live credentials
 * To activate: fill in PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID,
 *              PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET in .env
 * Paymob dashboard: https://accept.paymob.com
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

const PAYMOB_AUTH_URL = 'https://accept.paymob.com/api/auth/tokens';
const PAYMOB_ORDER_URL = 'https://accept.paymob.com/api/ecommerce/orders';
const PAYMOB_PAYMENT_KEY_URL = 'https://accept.paymob.com/api/acceptance/payment_keys';

export interface PaymobCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymobOrderItem {
  name: string;
  amount_cents: number;
  quantity: number;
}

@Injectable()
export class PaymobService {
  constructor(private configService: ConfigService) {}

  async authenticate(): Promise<string> {
    const apiKey = this.configService.get<string>('PAYMOB_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Paymob API key not configured');
    }
    try {
      const { data } = await axios.post<{ token: string }>(PAYMOB_AUTH_URL, {
        api_key: apiKey,
      });
      if (!data?.token) {
        throw new BadRequestException('Paymob authentication failed');
      }
      return data.token;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const msg = error?.response?.data?.message || error.message;
      throw new Error(`Paymob authentication failed: ${msg}`);
    }
  }

  async createPaymobOrder(
    authToken: string,
    amountCents: number,
    merchantOrderId: string,
    items: PaymobOrderItem[] = [],
  ): Promise<number> {
    try {
      const { data } = await axios.post<{ id: number }>(PAYMOB_ORDER_URL, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
        items: items.length ? items : [],
      });
      if (data?.id == null) {
        throw new BadRequestException('Paymob order registration failed');
      }
      return data.id;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const msg = error?.response?.data?.message || error.message;
      throw new Error(`Paymob order creation failed: ${msg}`);
    }
  }

  async getPaymentKey(
    authToken: string,
    paymobOrderId: number,
    amountCents: number,
    billingData: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    },
  ): Promise<string> {
    const integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID');
    if (!integrationId) {
      throw new BadRequestException('Paymob integration ID not configured');
    }
    try {
      const { data } = await axios.post<{ token: string }>(
        PAYMOB_PAYMENT_KEY_URL,
        {
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: paymobOrderId,
          billing_data: billingData,
          currency: 'EGP',
          integration_id: parseInt(integrationId, 10),
        },
      );
      if (!data?.token) {
        throw new BadRequestException('Paymob payment key creation failed');
      }
      return data.token;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const msg = error?.response?.data?.message || error.message;
      throw new Error(`Paymob payment key request failed: ${msg}`);
    }
  }

  async initiatePayment(
    amountEGP: number,
    orderId: string,
    customerInfo: PaymobCustomerInfo,
  ): Promise<{ paymentKeyToken: string; paymobOrderId: string }> {
    const amountCents = Math.round(amountEGP * 100);
    const authToken = await this.authenticate();
    const paymobOrderId = await this.createPaymobOrder(authToken, amountCents, orderId, []);
    const paymentKeyToken = await this.getPaymentKey(
      authToken,
      paymobOrderId,
      amountCents,
      {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone_number: customerInfo.phone,
      },
    );
    return {
      paymentKeyToken,
      paymobOrderId: String(paymobOrderId),
    };
  }

  /**
   * Verifies Paymob webhook HMAC signature.
   * Paymob sends obj with HMAC in a field; verify using PAYMOB_HMAC_SECRET.
   */
  verifyHmac(payload: Record<string, any>, receivedHmac: string): boolean {
    try {
      const hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
      if (!hmacSecret || !receivedHmac || typeof receivedHmac !== 'string') return false;
      const sortedKeys = Object.keys(payload).sort();
      const concat = sortedKeys
        .filter((k) => payload[k] !== undefined && payload[k] !== null && k !== 'hmac')
        .map((k) => {
          const v = payload[k];
          return typeof v === 'object' ? JSON.stringify(v) : String(v);
        })
        .join('');
      const expected = crypto.createHmac('sha512', hmacSecret).update(concat).digest('hex');
      const normalizedReceived = receivedHmac.toLowerCase();
      if (!/^[0-9a-f]+$/.test(normalizedReceived) || normalizedReceived.length !== expected.length) {
        return false;
      }
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(normalizedReceived, 'hex'));
    } catch {
      return false;
    }
  }
}
