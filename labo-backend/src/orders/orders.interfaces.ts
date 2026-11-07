export interface OrderWithRelations {
  id: string;
  laboratory_id: string;
  matricule: string;
  visit_id?: string | null;
  patient_id: string;
  practitioner_id?: string | null;
  created_by_id: string;
  order_date: Date;
  status: string;
  priority: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  patient?: any;
  visit?: any;
  practitioner?: any;
  order_items?: any[];
  created_by?: any;
}
