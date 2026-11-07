import { IsOptional, IsString, IsUUID, IsDateString } from "class-validator";

export class CreateResultValidationDto {
  @IsUUID("4", { message: "L ID du resultat doit etre un UUID valide" })
  result_id: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateResultValidationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchResultValidationsDto {
  @IsOptional()
  @IsUUID()
  result_id?: string;

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
