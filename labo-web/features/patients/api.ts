import { api, Patient, PatientContact } from "../../lib/api-client";

export async function fetchPatients(labId: string, page = 1, limit = 20, search?: string) {
  const params = new URLSearchParams({ laboratory_id: labId, page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return api.get<Patient[]>(`/patients?${params}`);
}

export async function fetchPatient(id: string, labId: string) {
  return api.get<Patient & { contacts: PatientContact[] }>(`/patients/${id}?laboratory_id=${labId}`);
}

export async function createPatient(labId: string, data: {
  first_name: string; last_name: string; birth_date?: string; gender?: string;
  phone?: string; email?: string; address?: string; ssn?: string;
}) {
  return api.post<Patient>('/patients', { laboratory_id: labId, ...data });
}

export async function updatePatient(id: string, labId: string, data: Partial<Patient>) {
  return api.patch<Patient>(`/patients/${id}?laboratory_id=${labId}`, data);
}

export async function deletePatient(id: string, labId: string) {
  return api.delete(`/patients/${id}?laboratory_id=${labId}`);
}

export async function createContact(patientId: string, labId: string, data: {
  first_name: string; last_name: string; relationship: string; phone: string;
  email?: string; is_primary?: boolean;
}) {
  return api.post<PatientContact>(`/patients/${patientId}/contacts?laboratory_id=${labId}`, data);
}

export async function deleteContact(patientId: string, contactId: string, labId: string) {
  return api.delete(`/patients/${patientId}/contacts/${contactId}?laboratory_id=${labId}`);
}