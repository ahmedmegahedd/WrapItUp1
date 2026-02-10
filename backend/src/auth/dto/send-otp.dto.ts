import { IsString, Matches } from 'class-validator';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export class SendOtpDto {
  @IsString()
  @Matches(E164_REGEX, { message: 'Phone must be in E.164 format' })
  phone: string;
}
