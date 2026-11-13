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