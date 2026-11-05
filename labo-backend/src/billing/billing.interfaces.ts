export interface InvoiceItemView {
  id: string;
  invoice_id: string;
  laboratory_id: string;
  test_catalog_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReceiptView {
  id: string;
  laboratory_id: string;
  payment_id: string;
  receipt_number: string;
  issued_at: Date;
  amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentView {
  id: string;
  laboratory_id: string;
  invoice_id: string | null;
  idempotency_key: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paid_at: Date | null;
  reference: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  receipt?: ReceiptView;
}

export interface PatientSummary {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
}

export interface InvoiceView {
  id: string;
  laboratory_id: string;
  invoice_number: string;
  visit_id: string | null;
  order_id: string | null;
  patient_id: string;
  issued_date: Date;
  due_date: Date | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  patient: PatientSummary | null;
  invoice_items: InvoiceItemView[];
  payments: PaymentView[];
}

export interface BillingStatistics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  by_status: Record<string, { count: number; amount: number }>;
  by_method: Record<string, { count: number; amount: number }>;
}

export interface CashJournalEntry {
  id: string;
  payment_id: string;
  receipt_number: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  patient_id: string;
  patient_name: string;
  amount: number;
  method: string;
  status: string;
  paid_at: Date | null;
  reference: string | null;
  created_at: Date;
}
