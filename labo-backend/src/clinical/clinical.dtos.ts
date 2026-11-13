import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CreateConsultationDto {
  @IsNotEmpty({ message: 'Le patient est requis' })
  @IsUUID('4')
  patient_id: string;

  @IsOptional()
  @IsUUID('4')
  visit_id?: string;

  @IsOptional()
  @IsUUID('4')
  practitioner_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class PrescriptionItemDto {
  @IsOptional()
  @IsUUID('4')
  test_catalog_id?: string;

  @IsNotEmpty({ message: 'Le libelle est requis' })
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsNotEmpty({ message: 'Le patient est requis' })
  @IsUUID('4')
  patient_id: string;

  @IsOptional()
  @IsUUID('4')
  visit_id?: string;

  @IsOptional()
  @IsUUID('4')
  consultation_id?: string;

  @IsOptional()
  @IsUUID('4')
  practitioner_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray({ message: 'Les lignes d ordonnance doivent etre une liste' })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}

export class UpdatePrescriptionDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SearchConsultationsDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;
}