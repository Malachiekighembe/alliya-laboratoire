import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateCollectionDto {
  @IsNotEmpty({ message: 'Le patient est requis' })
  @IsUUID('4', { message: "L ID du patient doit etre un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID('4', { message: "L ID de la visite doit etre un UUID valide" })
  visit_id?: string;

  @IsOptional()
  @IsUUID('4', { message: "L ID de la demande doit etre un UUID valide" })
  order_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de prelevement doit etre une date valide' })
  collection_date?: string;

  @IsOptional()
  @IsString()
  sample_type?: string;

  @IsOptional()
  @IsString()
  site?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  difficulties?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Démarre immédiatement le prélèvement (status = en_cours). */
  @IsOptional()
  started?: boolean;
}

export class CreateSpecimenFromCollectionDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  container?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSpecimensDto {
  @IsArray({ message: 'Les echantillons doivent etre une liste' })
  @ValidateNested({ each: true })
  @Type(() => CreateSpecimenFromCollectionDto)
  specimens: CreateSpecimenFromCollectionDto[];
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  sample_type?: string;

  @IsOptional()
  @IsString()
  site?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  difficulties?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchCollectionsDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

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