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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subscription?: LaboratorySubscription;
  stats?: LaboratoryStats;
}

export interface LaboratorySubscription {
  id: string;
  laboratory_id: string;
  plan: 'starter' | 'professional' | 'enterprise';
  plan_name: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  started_at: string;
  expires_at: string | null;
  price_monthly: number;
  currency: string;
  max_users: number | null;
  max_patients: number | null;
  max_analyses: number | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryStats {
  laboratory_id: string;
  users_count: number;
  patients_count: number;
  analyses_count: number;
  results_count: number;
  visits_count: number;
  last_activity: string | null;
}

export interface CreateLaboratoryInput {
  code: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active?: boolean;
  plan?: 'starter' | 'professional' | 'enterprise';
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

// Result type for non-blocking calls
export interface AsyncResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

// API base URL — configurable via env
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

type AuthHandlers = {
  getRefreshToken: () => string | null;
  onTokens: (tokens: { access_token: string; refresh_token: string }) => void;
  onUnauthorized: () => void;
};

class ApiClient {
  private token: string | null = null;
  private authHandlers: AuthHandlers | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private getCache = new Map<string, { at: number; data: unknown }>();
  private inflightGet = new Map<string, Promise<ApiEnvelope<any>>>();
  private readonly GET_CACHE_TTL = 30_000; // 30s: fast navigation, réduit la charge backend

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setAuthHandlers(handlers: AuthHandlers | null) {
    this.authHandlers = handlers;
  }

  clearCache(prefix?: string) {
    if (!prefix) { this.getCache.clear(); return; }
    for (const k of this.getCache.keys()) if (k.startsWith(prefix)) this.getCache.delete(k);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (!this.authHandlers) return null;
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const rt = this.authHandlers?.getRefreshToken();
        if (!rt) return null;
        try {
          const res = await this.fetchWithTimeout(`${API_BASE}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: rt }),
          });
          if (!res.ok) return null;
          const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{ access_token: string; refresh_token: string }>;
          const data = json.data as any;
          if (data?.access_token && data?.refresh_token) {
            this.setToken(data.access_token);
            this.authHandlers?.onTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
            return data.access_token as string;
          }
          return null;
        } catch {
          return null;
        }
      })().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retries: number = MAX_RETRIES,
  ): Promise<ApiEnvelope<T>> {
    const methodUp = method.toUpperCase();
    const isGet = methodUp === 'GET';

    // Cache GET: réponse instantanée si fraîche (navigation fluide / "offline-like")
    if (isGet) {
      const hit = this.getCache.get(path);
      if (hit && Date.now() - hit.at < this.GET_CACHE_TTL) {
        return hit.data as ApiEnvelope<T>;
      }
      const inflight = this.inflightGet.get(path);
      if (inflight) return inflight as Promise<ApiEnvelope<T>>;
    } else {
      // Mutation: invalider le cache lié pour voir les données à jour
      this.clearCache();
    }

    const doFetch = async (): Promise<ApiEnvelope<T>> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await this.fetchWithTimeout(
            `${API_BASE}/api/v1${path}`,
            {
              method: methodUp,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            },
          );

          if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
            const newToken = await this.tryRefreshToken();
            if (newToken) {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await this.fetchWithTimeout(
                `${API_BASE}/api/v1${path}`,
                { method: methodUp, headers, body: body ? JSON.stringify(body) : undefined },
              );
              if (retryRes.ok) {
                const json = (await retryRes.json()) as ApiEnvelope<T>;
                if (isGet) this.getCache.set(path, { at: Date.now(), data: json });
                return json;
              }
              const retryErr = (await retryRes.json().catch(() => ({}))) as ApiError;
              if (retryRes.status === 401) {
                this.authHandlers?.onUnauthorized();
              }
              throw new Error(retryErr.message || `HTTP ${retryRes.status}`);
            } else {
              this.authHandlers?.onUnauthorized();
            }
          }

          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as ApiError;
            throw new Error(err.message || `HTTP ${res.status}`);
          }

          const json = (await res.json()) as ApiEnvelope<T>;
          if (isGet) this.getCache.set(path, { at: Date.now(), data: json });
          return json;
        } catch (err) {
          lastError = err as Error;
          // Ne pas retry sur erreurs 4xx (client)
          if (err instanceof Error && err.message.startsWith('HTTP 4')) {
            throw err;
          }
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          }
        }
      }

      throw lastError || new Error('Requête échouée');
    };

    if (isGet) {
      const p = doFetch().finally(() => this.inflightGet.delete(path));
      this.inflightGet.set(path, p);
      return p;
    }
    return doFetch();
  }

  /// Non-blocking: returns { data, error, loading } without throwing
  async safeRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<AsyncResult<T>> {
    try {
      const res = await this.request<T>(method, path, body);
      return { data: res.data ?? null, error: null, loading: false };
    } catch (err) {
      return { data: null, error: err as Error, loading: false };
    }
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body?: unknown) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }

  safeGet<T>(path: string) { return this.safeRequest<T>('GET', path); }
  safePost<T>(path: string, body?: unknown) { return this.safeRequest<T>('POST', path, body); }
  safePatch<T>(path: string, body?: unknown) { return this.safeRequest<T>('PATCH', path, body); }
  safeDelete<T>(path: string) { return this.safeRequest<T>('DELETE', path); }
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
