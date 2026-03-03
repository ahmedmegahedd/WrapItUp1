import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_super_admin?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permission_ids?: string[];
}
