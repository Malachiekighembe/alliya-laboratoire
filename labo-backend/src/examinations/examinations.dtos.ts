import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTestCatalogDto {
  @IsString({ message: 'Le code est requis' })
  @MaxLength(50, { message: 'Le code ne peut pas dépasser 50 caractères' })
  code: string;

  @IsString({ message: 'Le nom est requis' })
  @MaxLength(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La catégorie ne peut pas dépasser 100 caractères' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Lunité doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Lunité ne peut pas dépasser 50 caractères' })
  unit?: string;

  @IsOptional()
  @IsString({ message: 'La plage de référence doit être une chaîne de caractères' })
  @MaxLength(200, { message: 'La plage de référence ne peut pas dépasser 200 caractères' })
  reference_range?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @Min(0, { message: 'Le prix doit être positif' })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt({ message: 'La durée doit être un entier' })
  @Min(0, { message: 'La durée doit être positive' })
  @Type(() => Number)
  duration_minutes?: number;
}

export class UpdateTestCatalogDto {
  @IsOptional()
  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le code ne peut pas dépasser 50 caractères' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La catégorie ne peut pas dépasser 100 caractères' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Lunité doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Lunité ne peut pas dépasser 50 caractères' })
  unit?: string;

  @IsOptional()
  @IsString({ message: 'La plage de référence doit être une chaîne de caractères' })
  @MaxLength(200, { message: 'La plage de référence ne peut pas dépasser 200 caractères' })
  reference_range?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @Min(0, { message: 'Le prix doit être positif' })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt({ message: 'La durée doit être un entier' })
  @Min(0, { message: 'La durée doit être positive' })
  @Type(() => Number)
  duration_minutes?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  is_active?: boolean;
}

export class SearchExaminationsDto {
  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  category?: string;

  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  @Type(() => Boolean)
  include_inactive?: boolean;
}
