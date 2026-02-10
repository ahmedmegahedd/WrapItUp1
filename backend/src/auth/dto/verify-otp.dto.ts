import { IsString, Matches, Length } from 'class-validator';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export class VerifyOtpDto {
  @IsString()
  @Matches(E164_REGEX, { message: 'Phone must be in E.164 format' })
  phone: string;

  @IsString()
  @Length(4, 8, { message: 'Code must be 4–8 characters' })
  code: string;
}
