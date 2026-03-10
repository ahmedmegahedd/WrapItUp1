import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PaymobService, PaymobCustomerInfo } from './paymob.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymobService: PaymobService,
    private readonly ordersService: OrdersService,
  ) {}

  async initiatePayment(
    amountEGP: number,
    orderId: string,
    customerInfo: PaymobCustomerInfo,
  ): Promise<{ paymentKeyToken: string; paymobOrderId: string }> {
    return this.paymobService.initiatePayment(amountEGP, orderId, customerInfo);
  }

  async handleWebhook(payload: Record<string, any>) {
    const receivedHmac = payload.hmac;
    if (!receivedHmac) {
      return { received: true };
    }

    const isValid = this.paymobService.verifyHmac(payload, receivedHmac);
    if (!isValid) {
      return { received: true };
    }

    const obj = payload.obj;
    if (!obj) {
      return { received: true };
    }

    const success = obj.success === true;
    const ourOrderId = obj.order?.merchant_order_id ?? obj.merchant_order_id;
    if (ourOrderId) {
      await this.ordersService.updatePaymentStatus(
        String(ourOrderId),
        success ? 'paid' : 'failed',
      );
    }

    return { received: true };
  }
}
