import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ligne de demande d'analyses (§5.3). */
export class CreateOrderItemDto {
  @IsNotEmpty({ message: "L'analyse est requise" })
  @IsUUID('4', { message: "L ID de l analyse doit etre un UUID valide" })
  test_catalog_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La quantite doit etre un entier' })
  @Min(1, { message: 'La quantite doit etre au moins 1' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix unitaire doit etre un nombre' })
  @Min(0, { message: 'Le prix unitaire ne peut pas etre negatif' })
  unit_price?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID('4', { message: "L ID de la visite doit etre un UUID valide" })
  visit_id?: string;

  @IsUUID('4', { message: "L ID du patient doit etre un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID('4', { message: "L ID du praticien doit etre un UUID valide" })
  practitioner_id?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Les analyses doivent etre une liste' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  payment_status?: string;
}

export class UpdateOrderItemDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  result_value?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchOrdersDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsString()
  search?: string;
}