import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
      this.stripe = new Stripe(stripeSecretKey);
    }
  }

  async createPaymentIntent(orderId: string, amount: number, currency = 'egp') {
    if (!this.stripe) {
      return {
        clientSecret: 'mock_client_secret_' + orderId,
        id: 'mock_pi_' + orderId,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // EGP: 1 EGP = 100 piastres (minor unit)
        currency: currency.toLowerCase(),
        metadata: { orderId },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(`Payment intent creation failed: ${error.message}`);
    }
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.stripe || !webhookSecret) {
      // Mock webhook handling for development
      return { received: true };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updatePaymentStatus(
          paymentIntent.metadata.orderId,
          'paid',
          paymentIntent.id,
        );
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updatePaymentStatus(
          failedPayment.metadata.orderId,
          'failed',
          failedPayment.id,
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
