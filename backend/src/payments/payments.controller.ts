import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() body: { orderId: string; amount: number }) {
    return this.paymentsService.createPaymentIntent(body.orderId, body.amount);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
