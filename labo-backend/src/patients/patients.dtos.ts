import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum Gender {
  M = 'M',
  F = 'F',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

export class CreatePatientDto {
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  first_name: string;

  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  last_name: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de naissance doit être une date valide' })
  birth_date?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Le genre doit être M, F, OTHER ou UNKNOWN' })
  gender?: Gender = Gender.UNKNOWN;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(150, { message: "L'email ne peut pas dépasser 150 caractères" })
  email?: string;

  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de sécurité sociale doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le numéro de sécurité sociale ne peut pas dépasser 50 caractères' })
  ssn?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  last_name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de naissance doit être une date valide' })
  birth_date?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Le genre doit être M, F, OTHER ou UNKNOWN' })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(150, { message: "L'email ne peut pas dépasser 150 caractères" })
  email?: string;

  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de sécurité sociale doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le numéro de sécurité sociale ne peut pas dépasser 50 caractères' })
  ssn?: string;
}

export class CreatePatientContactDto {
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  first_name: string;

  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  last_name: string;

  @IsNotEmpty({ message: 'Le lien de parenté est requis' })
  @IsString({ message: 'Le lien de parenté doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le lien de parenté ne peut pas dépasser 50 caractères' })
  relationship: string;

  @IsNotEmpty({ message: 'Le téléphone est requis' })
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(150, { message: "L'email ne peut pas dépasser 150 caractères" })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_primary doit être un booléen' })
  is_primary?: boolean = false;
}

export class UpdatePatientContactDto {
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  last_name?: string;

  @IsOptional()
  @IsString({ message: 'Le lien de parenté doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le lien de parenté ne peut pas dépasser 50 caractères' })
  relationship?: string;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(150, { message: "L'email ne peut pas dépasser 150 caractères" })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_primary doit être un booléen' })
  is_primary?: boolean;
}

export class SearchPatientDto {
  @IsNotEmpty({ message: 'La requête de recherche est requise' })
  @IsString({ message: 'La requête de recherche doit être une chaîne de caractères' })
  query: string;
}
