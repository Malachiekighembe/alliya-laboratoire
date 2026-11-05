export interface SpecimenWithRelations {
  id: string;
  laboratory_id: string;
  matricule: string;
  order_id?: string | null;
  visit_id?: string | null;
  patient_id: string;
  collected_by_id: string;
  collection_date: Date;
  type: string;
  container?: string | null;
  status: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  patient?: any;
  visit?: any;
  order?: any;
  collector?: any;
  results?: any[];
}
