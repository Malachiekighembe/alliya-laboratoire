import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsUUID('4', { message: "L ID du patient est requis" })
  patient_id: string;

  @IsOptional()
  @IsUUID('4')
  visit_id?: string;

  @IsOptional()
  @IsUUID('4')
  order_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/** Enregistrement de la remise du rapport au patient (§10.3). */
export class DeliverReportDto {
  @IsOptional()
  @IsString()
  recipient_name?: string;

  @IsOptional()
  @IsString()
  recipient_relation?: string;

  @IsOptional()
  @IsString()
  delivery_mode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de remise doit etre une date valide' })
  delivered_at?: string;
}

export class SearchReportsDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}