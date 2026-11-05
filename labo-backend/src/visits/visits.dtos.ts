import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum OrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateOrderItemDto {
  @IsNotEmpty({ message: "L'ID du test est requis" })
  @IsUUID(4, { message: "L'ID du test doit être un UUID valide" })
  test_catalog_id: string;

  @IsOptional()
  @IsString({ message: 'Le code doit être une chaine de carrieres' })
  @MaxLength(50, { message: 'Le code ne peut pas depasser 50 carrieres' })
  item_code?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaine de carrieres' })
  @MaxLength(255, { message: 'Le nom ne peut pas depasser 255 carrieres' })
  item_name?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaine de carrieres' })
  notes?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID(4, { message: "L'ID de la visite doit être un UUID valide" })
  visit_id?: string;

  @IsNotEmpty({ message: "L'ID du patient est requis" })
  @IsUUID(4, { message: "L'ID du patient doit être un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID(4, { message: "L'ID du praticien doit être un UUID valide" })
  practitioner_id?: string;

  @IsOptional()
  @IsEnum(OrderPriority, { message: 'La priorite doit etre low, normal, high ou urgent' })
  priority?: OrderPriority = OrderPriority.NORMAL;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaine de carrieres' })
  notes?: string;

  @IsArray({ message: 'Les items doivent etre un tableau' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class CreateVisitDto {
  @IsNotEmpty({ message: "L'ID du patient est requis" })
  @IsUUID(4, { message: "L'ID du patient doit être un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID(4, { message: "L'ID du praticien doit être un UUID valide" })
  practitioner_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de visite doit etre une date valide' })
  visit_date?: string;

  @IsOptional()
  @IsString({ message: 'Le motif doit être une chaine de carrieres' })
  @MaxLength(500, { message: 'Le motif ne peut pas depasser 500 carrieres' })
  reason?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaine de carrieres' })
  notes?: string;
}

export class UpdateVisitDto {
  @IsOptional()
  @IsUUID(4, { message: "L'ID du praticien doit être un UUID valide" })
  practitioner_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de visite doit etre une date valide' })
  visit_date?: string;

  @IsOptional()
  @IsString({ message: 'Le motif doit être une chaine de carrieres' })
  @MaxLength(500, { message: 'Le motif ne peut pas depasser 500 carrieres' })
  reason?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaine de carrieres' })
  notes?: string;

  @IsOptional()
  @IsEnum(VisitStatus, { message: 'Le statut doit etre scheduled, arrived, in_progress, completed, cancelled ou no_show' })
  status?: VisitStatus;
}

export class CancelVisitDto {
  @IsOptional()
  @IsString({ message: "Le motif d'annulation doit être une chaine de carrieres" })
  @MaxLength(500, { message: "Le motif d'annulation ne peut pas depasser 500 carrieres" })
  reason?: string;
}

export class CompleteVisitDto {
  @IsOptional()
  @IsString({ message: 'Les notes de completion doivent être une chaine de carrieres' })
  @MaxLength(500, { message: 'Les notes de completion ne peuvent pas depasser 500 carrieres' })
  reason?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderPriority, { message: 'La priorite doit etre low, normal, high ou urgent' })
  priority?: OrderPriority;

  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Le statut doit etre draft, submitted, in_progress, completed ou cancelled' })
  status?: OrderStatus;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaine de carrieres' })
  notes?: string;
}

export class SearchVisitsDto {
  @IsOptional()
  @IsUUID(4, { message: "L'ID du patient doit être un UUID valide" })
  patient_id?: string;

  @IsOptional()
  @IsEnum(VisitStatus, { message: 'Le statut doit etre scheduled, arrived, in_progress, completed, cancelled ou no_show' })
  status?: VisitStatus;

  @IsOptional()
  @IsDateString({}, { message: 'La date de debut doit etre une date valide' })
  date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit etre une date valide' })
  date_to?: string;

  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaine de carrieres' })
  search?: string;
}