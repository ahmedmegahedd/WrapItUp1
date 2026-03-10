import { Controller, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      return await this.paymentsService.initiatePayment(
        body.amountEGP,
        body.orderId,
        body.customerInfo,
      );
    } catch (error: any) {
      throw new HttpException(
        { message: error.message || 'Payment initiation failed' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('webhook')
  async handleWebhook(@Req() req: { body: Record<string, any> }) {
    const result = await this.paymentsService.handleWebhook(req.body);
    return result;
  }
}
