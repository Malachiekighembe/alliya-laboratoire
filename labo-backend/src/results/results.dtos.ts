import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

/** Statuts §11.1 : résultat biologique. */
export enum ResultStatus {
  BROUILLON = 'brouillon',
  EN_VERIFICATION = 'en_verification',
  A_CORRIGER = 'a_corriger',
  VALIDE = 'valide',
  REJETE = 'rejete',
  ANNULE = 'annule',
}

/** Types de saisie (§8.2). */
export enum ResultType {
  NUMERIC = 'numeric',
  TEXT = 'text',
  QUALITATIVE = 'qualitative',
  TABLE = 'table',
  DOCUMENT = 'document',
}

/** Paramètre d'un résultat (NFS, ionogramme...). */
export class ResultParameterDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Le nom du paramètre est requis' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_range?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;
}

export class CreateResultDto {
  @ApiProperty()
  @IsUUID()
  specimen_id: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  order_item_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  analysis_run_id?: string;

  @ApiProperty()
  @IsUUID()
  test_catalog_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_range?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(Object.values(ResultType))
  result_type?: ResultType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualitative_value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ type: [ResultParameterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultParameterDto)
  parameters?: ResultParameterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateResultDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_range?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(Object.values(ResultType))
  result_type?: ResultType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualitative_value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ type: [ResultParameterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultParameterDto)
  parameters?: ResultParameterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ValidateResultDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  /** Signature électronique (nom du signataire ou jeton). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}

export class AmendResultDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_range?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(Object.values(ResultType))
  result_type?: ResultType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualitative_value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({ type: [ResultParameterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultParameterDto)
  parameters?: ResultParameterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelResultDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

/** Demande de correction ou de reprise par le biologiste (§9.3). */
export class ReviewResultDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Le motif est requis' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class SearchResultsDto {
  @IsOptional()
  @IsUUID()
  specimen_id?: string;

  @IsOptional()
  @IsUUID()
  test_catalog_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsString()
  search?: string;
}