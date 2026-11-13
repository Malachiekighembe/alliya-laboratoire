import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAnalysisRunDto {
  @IsOptional()
  @IsUUID('4')
  order_id?: string;

  @IsOptional()
  @IsUUID('4')
  order_item_id?: string;

  @IsOptional()
  @IsUUID('4')
  specimen_id?: string;

  @IsUUID('4', { message: "L ID de l analyse est requis" })
  test_catalog_id: string;

  @IsOptional()
  @IsUUID('4')
  patient_id?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID('4')
  performed_by_id?: string;
}

export class UpdateAnalysisRunDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  performed_by_id?: string;
}

export class SearchAnalysisRunsDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;

  @IsOptional()
  @IsUUID()
  specimen_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}