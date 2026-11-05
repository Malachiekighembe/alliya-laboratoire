export interface ResultWithRelations {
  id: string;
  laboratory_id: string;
  matricule: string;
  specimen_id: string;
  order_item_id?: string | null;
  test_catalog_id: string;
  performed_by_id?: string | null;
  validated_by_id?: string | null;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status: string;
  version: number;
  validated_at?: Date | null;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResultFilters {
  specimen_id?: string;
  test_catalog_id?: string;
  status?: string;
  patient_id?: string;
  search?: string;
}
