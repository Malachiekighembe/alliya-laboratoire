import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/dto/pagination.dto.js';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CHECK = 'check',
  INSURANCE = 'insurance',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class CreateInvoiceItemDto {
  @IsNotEmpty({ message: 'La description est requise' })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La quantité doit être un entier' })
  @Min(1, { message: 'La quantité doit être supérieure ou égale à 1' })
  quantity: number = 1;

  @IsNotEmpty({ message: 'Le prix unitaire est requis' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix unitaire doit être un nombre' })
  @Min(0, { message: 'Le prix unitaire ne peut pas être négatif' })
  unit_price: number;

@IsOptional()
  @IsUUID(4, { message: "L'ID du catalogue de tests doit être un UUID valide" })
  test_catalog_id?: string;

  /** Type de frais (liste « Type de frais » de /parametres). */
  @IsOptional()
  @IsString({ message: 'Le type de frais doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le type de frais ne peut pas dépasser 50 caractères' })
  fee_type?: string;
}

export class CreateInvoiceDto {
  @IsNotEmpty({ message: "L'ID du patient est requis" })
  @IsUUID(4, { message: "L'ID du patient doit être un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID(4, { message: "L'ID de la visite doit être un UUID valide" })
  visit_id?: string;

  @IsOptional()
  @IsUUID(4, { message: "L'ID de l'ordonnance doit être un UUID valide" })
  order_id?: string;

  @IsOptional()
  @IsDateString({}, { message: "La date d'échéance doit être une date valide" })
  due_date?: string;

  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  currency?: string = 'EUR';

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @MaxLength(1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' })
  notes?: string;

  @IsArray({ message: 'Les articles doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString({}, { message: "La date d'échéance doit être une date valide" })
  due_date?: string;

  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  currency?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @MaxLength(1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' })
  notes?: string;
}

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'La clé d\'idempotence est requise' })
  @IsString({ message: 'La clé d\'idempotence doit être une chaîne de caractères' })
  idempotency_key: string;

  @IsNotEmpty({ message: 'Le montant est requis' })
  @Type(() => Number)
  @IsPositive({ message: 'Le montant doit être supérieur à 0' })
  amount: number;

  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  currency?: string = 'EUR';

  @IsNotEmpty({ message: 'La méthode de paiement est requise' })
  @IsEnum(PaymentMethod, { message: "La méthode doit être cash, card, transfer, check ou insurance" })
  method: PaymentMethod;

  @IsOptional()
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La référence ne peut pas dépasser 100 caractères' })
  reference?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @MaxLength(1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de paiement doit être une date valide' })
  paid_at?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentMethod, { message: "La méthode doit être cash, card, transfer, check ou insurance" })
  method?: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Le montant doit être supérieur à 0' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  reference?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Le statut doit être pending, completed, failed ou refunded' })
  status?: PaymentStatus;
}

export class IssueInvoiceDto {
  @IsOptional()
  @IsDateString({}, { message: "La date d'échéance doit être une date valide" })
  due_date?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;
}

export class PayInvoiceDto {
  @IsOptional()
  @IsEnum(PaymentMethod, { message: "La méthode doit être cash, card, transfer, check ou insurance" })
  method?: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Le montant doit être supérieur à 0' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'La clé d\'idempotence doit être une chaîne de caractères' })
  idempotency_key?: string;

  @IsOptional()
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  reference?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de paiement doit être une date valide' })
  paid_at?: string;
}

export class CancelInvoiceDto {
  @IsOptional()
  @IsString({ message: "Le motif d'annulation doit être une chaîne de caractères" })
  @MaxLength(1000, { message: "Le motif d'annulation ne peut pas dépasser 1000 caractères" })
  notes?: string;
}

export class SearchBillingDto extends PaginationDto {
  @IsOptional()
  @IsUUID(4, { message: "L'ID du patient doit être un UUID valide" })
  patient_id?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus, { message: 'Le statut doit être draft, issued, paid, partially_paid, overdue, cancelled ou refunded' })
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être une date valide' })
  date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être une date valide' })
  date_to?: string;
}
