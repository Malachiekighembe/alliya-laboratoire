import { IsString, IsEmail, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsUUID() laboratory_id: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsOptional() @IsString() device_id?: string;
}

export class RegisterDto {
  @IsUUID() laboratory_id: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() first_name: string;
  @IsString() last_name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsUUID(undefined, { each: true }) role_ids?: string[];
  @IsOptional() @IsUUID() assigned_by?: string;
}

export class RefreshTokenDto {
  @IsString() refresh_token: string;
  @IsOptional() @IsString() device_id?: string;
}

export class ChangePasswordDto {
  @IsString() current_password: string;
  @IsString() @MinLength(8) new_password: string;
}