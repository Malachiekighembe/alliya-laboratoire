import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/** Statuts §11.1 : rendez-vous. */
export const APPOINTMENT_STATUSES = ['planifie', 'confirme', 'honore', 'annule', 'absent'] as const;

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Le patient est requis' })
  @IsUUID('4')
  patient_id: string;

  @IsNotEmpty({ message: 'La date du rendez-vous est requise' })
  @IsDateString({}, { message: 'La date du rendez-vous doit etre une date valide' })
  appointment_date: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString({}, { message: 'La date du rendez-vous doit etre une date valide' })
  appointment_date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchAppointmentsDto {
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