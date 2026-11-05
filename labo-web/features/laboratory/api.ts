import { api, Specimen, Result } from "../../lib/api-client";

export async function fetchSpecimens(labId: string, page = 1, limit = 20, filters?: {
  patient_id?: string; status?: string; date_from?: string; date_to?: string; type?: string;
}) {
  const params = new URLSearchParams({ laboratory_id: labId, page: String(page), limit: String(limit) });
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  return api.get<Specimen[]>(`/specimens?${params}`);
}

export async function createSpecimen(labId: string, data: {
  order_id?: string; visit_id?: string; patient_id: string; type: string; container?: string; notes?: string;
}) {
  return api.post<Specimen>('/specimens', { laboratory_id: labId, ...data });
}

export async function updateSpecimenStatus(id: string, labId: string, status: string, notes?: string) {
  return api.patch(`/specimens/${id}/status?laboratory_id=${labId}`, { status, notes });
}

export async function fetchResults(labId: string, specimenId?: string) {
  const params = new URLSearchParams({ laboratory_id: labId });
  if (specimenId) params.set('specimen_id', specimenId);
  return api.get<Result[]>(`/results?${params}`);
}

export async function createResult(labId: string, data: {
  specimen_id: string; order_item_id?: string; test_catalog_id: string;
  value?: string; unit?: string; reference_range?: string; notes?: string;
}) {
  return api.post<Result>('/results', { laboratory_id: labId, ...data });
}

export async function validateResult(id: string, labId: string, notes?: string) {
  return api.patch(`/results/${id}/validate?laboratory_id=${labId}`, { notes });
}