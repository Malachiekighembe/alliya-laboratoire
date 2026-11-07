import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreatePatientCarnetDto {
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID()
  patient_id: string;

  @IsNotEmpty({ message: 'L\'ID du laboratoire est requis' })
  @IsUUID()
  laboratory_id: string;

  @IsOptional()
  @IsString()
  matricule?: string;
}

export class UpdatePatientCarnetDto {
  @IsOptional()
  @IsString()
  matricule?: string;
}

export class PatientCarnetVisitDto {
  @IsNotEmpty()
  @IsString()
  visit_id: string;

  @IsNotEmpty()
  @IsString()
  visit_date: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
