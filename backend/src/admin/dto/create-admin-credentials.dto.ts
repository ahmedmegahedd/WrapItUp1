import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateAdminCredentialsDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @Transform(({ value }) => (value != null ? String(value).trim() : value))
  @Matches(UUID_REGEX, { message: 'role_id must be a UUID' })
  role_id: string;
}
