"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useConfigurationOptions, useLabPatients, useTestCatalog } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type OrderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string;
  onCreated?: (created?: any) => void;
};

type Line = { test_catalog_id: string; quantity: string; unit_price: string };

const emptyLine: Line = { test_catalog_id: "", quantity: "1", unit_price: "" };

export function OrderFormDialog({ open, onOpenChange, laboratoryId, patientId, onCreated }: OrderFormDialogProps) {
  const { patients, loading: loadingPatients } = useLabPatients(open ? laboratoryId : null);
  const { tests, loading: loadingTests } = useTestCatalog(open ? laboratoryId : null);
  const { items } = useConfigurationOptions(open ? laboratoryId : null);

  const priorities = React.useMemo(
    () => (items.priority ?? []).filter((item: any) => item.is_active !== false).map((item: any) => String(item.code)),
    [items],
  );

  const [form, setForm] = React.useState({ patient_id: patientId || "", visit_id: "", priority: "normale", notes: "" });
  const [visits, setVisits] = React.useState<any[]>([]);
  const [lines, setLines] = React.useState<Line[]>([{ ...emptyLine }]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ patient_id: patientId || "", visit_id: "", priority: priorities[0] || "normale", notes: "" });
    setLines([{ ...emptyLine }]);
  }, [open, patientId, priorities]);

  // Visites du patient sélectionné (pour rattacher la demande à un passage).
  React.useEffect(() => {
    if (!open || !form.patient_id) { setVisits([]); return; }
    let cancelled = false;
    (async () => {
      const query = `/visits?patient_id=${form.patient_id}&limit=20${laboratoryId ? `&laboratory_id=${laboratoryId}` : ""}`;
      const res = await api.safeGet<any>(query);
      if (cancelled) return;
      const payload: any = res.data;
      const list = Array.isArray(payload) ? payload : payload?.items ?? [];
      setVisits(Array.isArray(list) ? list : []);
    })();
    return () => { cancelled = true; };
  }, [open, form.patient_id, laboratoryId]);

  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0), 0);

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const pickTest = (index: number, testId: string) => {
    if (!testId) { updateLine(index, { test_catalog_id: "", unit_price: "" }); return; }
    const test = tests.find((t) => t.id === testId);
    updateLine(index, {
      test_catalog_id: testId,
      unit_price: test?.price !== undefined && test?.price !== null ? String(test.price) : "",
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const payloadLines = lines.filter((line) => line.test_catalog_id);
    if (!form.patient_id) { setError("Sélectionnez un patient"); return; }
    if (payloadLines.length === 0) { setError("Ajoutez au moins un examen"); return; }

    setSaving(true);
    try {
      const res = await api.post<any>("/orders", {
        patient_id: form.patient_id,
        visit_id: form.visit_id || undefined,
        priority: form.priority,
        notes: form.notes.trim() || undefined,
        items: payloadLines.map((line) => ({
          test_catalog_id: line.test_catalog_id,
          quantity: Number(line.quantity) || 1,
          unit_price: line.unit_price === "" ? undefined : Number(line.unit_price),
        })),
      });
      const created = res?.data ?? null;
      onOpenChange(false);
      onCreated?.(created ?? undefined);
    } catch (err: any) {
      setError(err?.message || "Création de la demande impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle demande d'examens"
      description="Prescrivez les examens : la demande part au laboratoire pour prélèvement."
      error={error}
      saving={saving}
      submitLabel="Créer la demande"
      size="lg"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Patient" htmlFor="order_patient">
          <select
            id="order_patient"
            className={controlClass}
            value={form.patient_id}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value, visit_id: "" })}
            disabled={loadingPatients || saving}
          >
            <option value="">{loadingPatients ? "Chargement des patients…" : "Sélectionner un patient"}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ")}{p.matricule ? ` — ${p.matricule}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Visite" htmlFor="order_visit" hint="Facultatif — laissez vide pour une demande directe">
          <select
            id="order_visit"
            className={controlClass}
            value={form.visit_id}
            onChange={(e) => setForm({ ...form, visit_id: e.target.value })}
            disabled={!form.patient_id || saving}
          >
            <option value="">Aucune visite</option>
            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.matricule}{visit.visit_date ? ` — ${new Date(visit.visit_date).toLocaleDateString("fr-FR")}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Priorité" htmlFor="order_priority">
        <select
          id="order_priority"
          className={controlClass}
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          disabled={saving}
        >
          {(priorities.length ? priorities : ["normale", "urgente", "stat"]).map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-slate-700">Examens prescrits</p>
          <span className="text-[11px] text-slate-400">{loadingTests ? "Chargement du catalogue…" : `${tests.length} examen(s)`}</span>
        </div>

        {lines.map((line, index) => {
          const test = tests.find((t) => t.id === line.test_catalog_id);
          return (
            <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 sm:p-3">
              <div className="grid gap-2 sm:grid-cols-[2fr_.5fr_.7fr_auto] sm:items-end">
                <Field label={index === 0 ? "Examen" : "\u00A0"} htmlFor={`order_test_${index}`}>
                  <select
                    id={`order_test_${index}`}
                    className={controlClass}
                    value={line.test_catalog_id}
                    onChange={(e) => pickTest(index, e.target.value)}
                    disabled={saving || loadingTests}
                  >
                    <option value="">Sélectionner un examen…</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.name}{t.price !== undefined && t.price !== null ? ` (${t.price})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={index === 0 ? "Qté" : "\u00A0"} htmlFor={`order_qty_${index}`}>
                  <input
                    id={`order_qty_${index}`}
                    type="number"
                    min="1"
                    className={controlClass}
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    disabled={saving}
                  />
                </Field>
                <Field label={index === 0 ? "Prix unitaire" : "\u00A0"} htmlFor={`order_price_${index}`}>
                  <input
                    id={`order_price_${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    className={controlClass}
                    placeholder="0.00"
                    value={line.unit_price}
                    onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                    disabled={saving}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => setLines((prev) => (prev.length === 1 ? [{ ...emptyLine }] : prev.filter((_, i) => i !== index)))}
                  className="mb-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                  disabled={saving}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {test?.sample_type || test?.preparation ? (
                <p className="text-[11px] text-slate-500">
                  {[test?.sample_type ? `Échantillon : ${test.sample_type}` : null, test?.preparation ? `Préparation : ${test.preparation}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs font-medium text-slate-600 transition-colors hover:border-[#1E2A47] hover:text-[#1E2A47]"
          disabled={saving}
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un examen
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#F5F8FA] px-3 py-2.5">
        <span className="text-xs sm:text-sm text-slate-500">Total estimé</span>
        <span className="text-sm sm:text-base font-semibold text-[#1E2A47]">{total.toLocaleString("fr-FR")}</span>
      </div>

      <Field label="Notes" htmlFor="order_notes" hint="Facultatif">
        <textarea
          id="order_notes"
          rows={2}
          className={controlClass}
          placeholder="Consignes particulières…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}