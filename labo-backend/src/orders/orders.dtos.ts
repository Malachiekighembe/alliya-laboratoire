import { IsOptional, IsString, IsUUID, IsDateString } from "class-validator";

export class CreateOrderDto {
  @IsOptional()
  @IsUUID("4", { message: "L ID de la visite doit etre un UUID valide" })
  visit_id?: string;

  @IsUUID("4", { message: "L ID du patient doit etre un UUID valide" })
  patient_id: string;

  @IsOptional()
  @IsUUID("4", { message: "L ID du praticien doit etre un UUID valide" })
  practitioner_id?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  notes?: string;
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
