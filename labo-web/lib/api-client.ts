// API client shared types and helpers for Alliya Laboratoire

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}

export interface User {
  id: string;
  laboratory_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
}

export interface Patient {
  id: string;
  laboratory_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  ssn: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientContact {
  id: string;
  patient_id: string;
  laboratory_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
  email: string | null;
  is_primary: boolean;
}

export interface Visit {
  id: string;
  laboratory_id: string;
  matricule: string;
  patient_id: string;
  created_by_id: string;
  practitioner_id: string | null;
  visit_date: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  laboratory_id: string;
  matricule: string;
  visit_id: string | null;
  patient_id: string;
  practitioner_id: string | null;
  created_by_id: string;
  order_date: string;
  status: string;
  priority: string;
  notes: string | null;
}

export interface TestCatalog {
  id: string;
  laboratory_id: string;
  code: string;
  name: string;
  category: string | null;
  unit: string | null;
  reference_range: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
}

export interface Specimen {
  id: string;
  laboratory_id: string;
  matricule: string;
  order_id: string | null;
  visit_id: string | null;
  patient_id: string;
  collected_by_id: string;
  collection_date: string;
  type: string;
  container: string | null;
  status: string;
  notes: string | null;
}

export interface Result {
  id: string;
  laboratory_id: string;
  matricule: string;
  specimen_id: string;
  order_item_id: string | null;
  test_catalog_id: string;
  performed_by_id: string | null;
  validated_by_id: string | null;
  value: string | null;
  unit: string | null;
  reference_range: string | null;
  status: string;
  version: number;
  validated_at: string | null;
  deleted_at: string | null;
}

export interface Invoice {
  id: string;
  laboratory_id: string;
  invoice_number: string;
  visit_id: string | null;
  order_id: string | null;
  patient_id: string;
  issued_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface Payment {
  id: string;
  laboratory_id: string;
  invoice_id: string | null;
  idempotency_key: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paid_at: string | null;
  reference: string | null;
}

export interface Product {
  id: string;
  laboratory_id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string | null;
  current_stock: number;
  min_stock: number;
  price: number | null;
  is_active: boolean;
}

export interface Laboratory {
  id: string;
  code: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
}

export interface DashboardStats {
  patients: number;
  visits: number;
  orders: number;
  specimens: number;
  results: number;
  pending_validations: number;
  invoices_total: number;
  payments_collected: number;
  low_stock_alerts: number;
  expiring_lots: number;
}

// API base URL — configurable via env
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as ApiError;
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json() as Promise<ApiEnvelope<T>>;
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body?: unknown) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const api = new ApiClient();

// Helpers
export function formatMatricule(m: string): string { return m; }
export function formatStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
export function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}
export function formatDateTime(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR');
}
export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(amount));
}