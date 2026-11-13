"use client";

import * as React from "react";
import { api } from "@/lib/api-client";

function toArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function useLabPatients(laboratoryId?: string | null) {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!laboratoryId) { setPatients([]); return; }
    setLoading(true);
    const res = await api.safeGet<any>(`/patients?laboratory_id=${laboratoryId}`);
    setPatients(toArray(res.data));
    setLoading(false);
  }, [laboratoryId]);

  React.useEffect(() => { void load(); }, [load]);

  return { patients, loading, reload: load };
}

export function useTestCatalog(laboratoryId?: string | null) {
  const [tests, setTests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!laboratoryId) { setTests([]); return; }
    setLoading(true);
    const res = await api.safeGet<any>(`/examinations?laboratory_id=${laboratoryId}`);
    setTests(toArray(res.data));
    setLoading(false);
  }, [laboratoryId]);

  React.useEffect(() => { void load(); }, [load]);

  return { tests, loading, reload: load };
}

export type ConfigurationCategory = { value: string; label: string };

export type ConfigurationCatalog = {
  categories: ConfigurationCategory[];
  items: Record<string, any[]>;
};

/** Catalogue de configuration (examens, frais, échantillons, unités…). */
export function useConfigurationOptions(laboratoryId?: string | null) {
  const [catalog, setCatalog] = React.useState<ConfigurationCatalog>({ categories: [], items: {} });
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!laboratoryId) {
      setCatalog({ categories: [], items: {} });
      return;
    }
    setLoading(true);
    const res = await api.safeGet<any>(`/configuration/options?laboratory_id=${laboratoryId}`);
    const data = res.data as any;
    setCatalog({
      categories: Array.isArray(data?.categories) ? data.categories : [],
      items: data?.items && typeof data.items === "object" ? data.items : {},
    });
    setLoading(false);
  }, [laboratoryId]);

  React.useEffect(() => { void load(); }, [load]);

  return { ...catalog, loading, reload: load };
}

/** Catégories de paramétrage, pour construire les onglets d'administration. */
export function useConfigurationCategories() {
  const [categories, setCategories] = React.useState<ConfigurationCategory[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .safeGet<any>("/configuration/categories")
      .then((res) => {
        if (cancelled) return;
        const data = (res.data as any)?.data ?? res.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading };
}