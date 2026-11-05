import { IsEmail, IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password!: string;

  @IsString({ message: 'Le prénom doit être une chaîne' })
  @MaxLength(100)
  first_name!: string;

  @IsString({ message: 'Le nom doit être une chaîne' })
  @MaxLength(100)
  last_name!: string;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne' })
  phone?: string;

  @IsOptional()
  @IsUUID('4', { each: true, message: 'role_ids doit contenir des UUID valides' })
  role_ids?: string[];
}

export class UpdateUserDto {
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
}

export class UpdatePasswordDto {
  @IsString({ message: 'Le mot de passe actuel est requis' })
  current_password!: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
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
