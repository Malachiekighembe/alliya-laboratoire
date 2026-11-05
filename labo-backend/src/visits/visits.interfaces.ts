export interface VisitWithPatient {
  id: string;
  laboratory_id: string;
  matricule: string;
  patient_id: string;
  created_by_id: string;
  practitioner_id: string | null;
  visit_date: Date;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  patient?: {
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  practitioner?: {
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
    specialty: string | null;
  } | null;
}

export interface OrderWithItems {
  id: string;
  laboratory_id: string;
  matricule: string;
  visit_id: string | null;
  patient_id: string;
  practitioner_id: string | null;
  created_by_id: string;
  order_date: Date;
  status: string;
  priority: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  items: OrderItem[];
  patient?: {
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
  };
  practitioner?: {
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  laboratory_id: string;
  test_catalog_id: string;
  item_code: string | null;
  item_name: string;
  status: string;
  result_value: string | null;
  result_unit: string | null;
  reference_range: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  test_catalog?: {
    id: string;
    code: string;
    name: string;
    category: string | null;
    unit: string | null;
    reference_range: string | null;
    price: any;
    duration_minutes: number | null;
  };
}

export interface VisitStatistics {
  total: number;
  by_status: Record<string, number>;
  period?: {
    from: string;
    to: string;
  };
}