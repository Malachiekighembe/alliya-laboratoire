import { api, Visit, Order, TestCatalog } from "../../lib/api-client";

export async function fetchVisits(labId: string, page = 1, limit = 20, filters?: {
  patient_id?: string; status?: string; date_from?: string; date_to?: string; search?: string;
}) {
  const params = new URLSearchParams({ laboratory_id: labId, page: String(page), limit: String(limit) });
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  }
  return api.get<Visit[]>(`/visits?${params}`);
}

export async function fetchVisit(id: string, labId: string) {
  return api.get<Visit>(`/visits/${id}?laboratory_id=${labId}`);
}

export async function createVisit(labId: string, data: {
  patient_id: string; practitioner_id?: string; visit_date?: string; reason?: string; notes?: string;
}) {
  return api.post<Visit>('/visits', { laboratory_id: labId, ...data });
}

export async function createOrder(labId: string, data: {
  visit_id?: string; patient_id: string; practitioner_id?: string; priority?: string;
  notes?: string; items: { test_catalog_id: string; item_code?: string; item_name?: string; notes?: string }[];
}) {
  return api.post<Order>('/visits/orders', { laboratory_id: labId, ...data });
}

export async function fetchExaminations(labId: string, search?: string) {
  const params = new URLSearchParams({ laboratory_id: labId });
  if (search) params.set('search', search);
  return api.get<TestCatalog[]>(`/examinations?${params}`);
}