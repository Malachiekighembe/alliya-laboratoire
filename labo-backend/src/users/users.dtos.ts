import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength, MaxLength, ValidateNested } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsUUID('4', { message: 'laboratory_id doit être un UUID valide' })
  laboratory_id?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @MinLength(4, { message: 'Le mot de passe doit contenir au moins 4 caractères' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne' })
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne' })
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne' })
  phone?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID('4', { each: true, message: 'role_ids doit contenir des UUID valides' })
  role_ids?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsUUID('4')
  laboratory_id?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatePasswordDto {
  @IsOptional()
  @IsString({ message: 'Le mot de passe actuel est requis' })
  current_password?: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(4, { message: 'Le nouveau mot de passe doit contenir au moins 4 caractères' })
  new_password!: string;
}

export class AssignRolesDto {
  @IsUUID('4', { each: true, message: 'role_ids doit contenir des UUID valides' })
  role_ids!: string[];
}

export class ActivateUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeactivateUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
