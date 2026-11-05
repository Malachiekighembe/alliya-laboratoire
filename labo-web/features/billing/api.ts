import { api, Invoice, Payment, Product } from "../../lib/api-client";

export async function fetchInvoices(labId: string, page = 1, limit = 20, filters?: {
  patient_id?: string; status?: string; date_from?: string; date_to?: string;
}) {
  const params = new URLSearchParams({ laboratory_id: labId, page: String(page), limit: String(limit) });
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  return api.get<Invoice[]>(`/billing?${params}`);
}

export async function createInvoice(labId: string, data: {
  visit_id?: string; order_id?: string; patient_id: string; currency?: string; notes?: string;
}) {
  return api.post<Invoice>('/billing', { laboratory_id: labId, ...data });
}

export async function addPayment(invoiceId: string, labId: string, data: {
  amount: number; method: string; idempotency_key: string; reference?: string; notes?: string;
}) {
  return api.post(`/billing/${invoiceId}/payments?laboratory_id=${labId}`, data);
}

export async function fetchProducts(labId: string) {
  return api.get<Product[]>(`/inventory/products?laboratory_id=${labId}`);
}