import { Controller, Post, Body, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';

export class InitiatePaymentDto {
  amountEGP: number;
  orderId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  async initiate(@Body() body: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(
      body.amountEGP,
      body.orderId,
      body.customerInfo,
    );
  }

  @Post('webhook')
  async handleWebhook(@Req() req: { body: Record<string, any> }) {
    const result = await this.paymentsService.handleWebhook(req.body);
    return result;
  }
}
