import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push-token')
  registerPushToken(@Body() body: { email?: string; token?: string }) {
    if (body.email && body.token) {
      this.notificationsService.registerPushToken(body.email, body.token);
    }
    return { ok: true };
  }
}
