import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePatientDocumentDto {
  @IsUUID('4', { message: "L ID du patient est requis" })
  patient_id: string;

  @IsOptional()
  @IsUUID('4', { message: "L ID de la visite doit etre un UUID valide" })
  visit_id?: string;

  @IsOptional()
  @IsUUID('4', { message: "L ID de la demande doit etre un UUID valide" })
  order_id?: string;

  @IsIn(['bon_examen', 'ordonnance', 'compte_rendu', 'facture'], {
    message: 'Type de document invalide',
  })
  document_type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Contenu libre pour les documents sans demande liée (ordonnance, note). */
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}

export class SearchPatientDocumentsDto {
  @IsOptional()
  @IsUUID('4')
  patient_id?: string;

  @IsOptional()
  @IsUUID('4')
  order_id?: string;

  @IsOptional()
  @IsString()
  document_type?: string;
}