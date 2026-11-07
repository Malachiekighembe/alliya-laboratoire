export interface ResultValidationWithRelations {
  id: string;
  laboratory_id: string;
  result_id: string;
  validated_by_id: string;
  validation_date: Date;
  status: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  result?: any;
  validated_by?: any;
}
