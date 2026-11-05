import { Type } from "class-transformer";
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSpecimenDto {
  @IsOptional()
  @IsUUID("4", { message: "L ID de la commande doit etre un UUID valide" })
  order_id?: string;

  @IsOptional()
  @IsUUID("4", { message: "L ID de la visite doit etre un UUID valide" })
  visit_id?: string;

  @IsUUID("4", { message: "L ID du patient doit etre un UUID valide" })
  patient_id: string;

  @IsString({ message: "Le type doit etre une chaine de carrieres" })
  type: string;

  @IsOptional()
  @IsString({ message: "Le recipient doit etre une chaine" })
  container?: string;

  @IsOptional()
  @IsString({ message: "Les notes doivent etre une chaine" })
  notes?: string;
}

export class UpdateSpecimenDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  container?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateSpecimenStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectSpecimenDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DiscardSpecimenDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SearchSpecimensDto {
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

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;
}