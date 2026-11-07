export interface PatientCarnet {
  id: string;
  laboratory_id: string;
  patient_id: string;
  matricule: string;
  visit_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PatientCarnetWithVisits extends PatientCarnet {
  visits?: any[];
}
