import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

/** E.164: optional + followed by 6–15 digits. Egypt: +20 followed by 10 digits. */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsString({ message: 'Phone number is required' })
  @Matches(E164_REGEX, {
    message: 'Phone must be in E.164 format (e.g. +201234567890)',
  })
  phone: string;
}
