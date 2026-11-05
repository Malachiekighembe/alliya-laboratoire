export interface PatientWithContacts {
  id: string;
  laboratory_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  birth_date: Date | null;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  ssn: string | null;
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  patient_contacts?: any[];
}
