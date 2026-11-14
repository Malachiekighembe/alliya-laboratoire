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

  /** Type d'examen (liste « Type d'examen » de /parametres). */
  @IsOptional()
  @IsString({ message: "Le type d'examen doit être une chaîne de caractères" })
  @MaxLength(50, { message: "Le type d'examen ne peut pas dépasser 50 caractères" })
  exam_type?: string;

  /** Section technique (liste « Section technique » de /parametres). */
  @IsOptional()
  @IsString({ message: 'La section doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La section ne peut pas dépasser 100 caractères' })
  section?: string;

  /** Type d'échantillon (liste « Type d'échantillon » de /parametres). */
  @IsOptional()
  @IsString({ message: "Le type d'échantillon doit être une chaîne de caractères" })
  @MaxLength(50, { message: "Le type d'échantillon ne peut pas dépasser 50 caractères" })
  sample_type?: string;

  @IsOptional()
  @IsString({ message: 'Le contenant doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le contenant ne peut pas dépasser 100 caractères' })
  container?: string;

  @IsOptional()
  @IsString({ message: 'La préparation doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La préparation ne peut pas dépasser 255 caractères' })
  preparation?: string;

  @IsOptional()
  @IsString({ message: 'La méthode doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La méthode ne peut pas dépasser 100 caractères' })
  method?: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

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
  @IsString({ message: "Le type d'examen doit être une chaîne de caractères" })
  @MaxLength(50, { message: "Le type d'examen ne peut pas dépasser 50 caractères" })
  exam_type?: string;

  @IsOptional()
  @IsString({ message: 'La section doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La section ne peut pas dépasser 100 caractères' })
  section?: string;

  @IsOptional()
  @IsString({ message: "Le type d'échantillon doit être une chaîne de caractères" })
  @MaxLength(50, { message: "Le type d'échantillon ne peut pas dépasser 50 caractères" })
  sample_type?: string;

  @IsOptional()
  @IsString({ message: 'Le contenant doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le contenant ne peut pas dépasser 100 caractères' })
  container?: string;

  @IsOptional()
  @IsString({ message: 'La préparation doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La préparation ne peut pas dépasser 255 caractères' })
  preparation?: string;

  @IsOptional()
  @IsString({ message: 'La méthode doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La méthode ne peut pas dépasser 100 caractères' })
  method?: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

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
  @IsString({ message: "Le type d'examen doit être une chaîne de caractères" })
  exam_type?: string;

  @IsOptional()
  @IsString({ message: 'La section doit être une chaîne de caractères' })
  section?: string;

  @IsOptional()
  @IsString({ message: "Le type d'échantillon doit être une chaîne de caractères" })
  sample_type?: string;

  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  @Type(() => Boolean)
  include_inactive?: boolean;
}