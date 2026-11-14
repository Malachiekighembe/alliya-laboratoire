"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { useLabPatients } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type VisitFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string;
  onCreated?: (created?: any) => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function VisitFormDialog({ open, onOpenChange, laboratoryId, patientId, onCreated }: VisitFormDialogProps) {
  const { patients, loading: loadingPatients } = useLabPatients(open ? laboratoryId : null);
  const [form, setForm] = React.useState({ patient_id: patientId || "", visit_date: today(), reason: "", notes: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ patient_id: patientId || "", visit_date: today(), reason: "", notes: "" });
  }, [open, patientId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post<any>("/visits", {
        patient_id: form.patient_id || undefined,
        visit_date: form.visit_date ? new Date(`${form.visit_date}T09:00:00`).toISOString() : undefined,
        reason: form.reason.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      const created = res?.data ?? null;
      onOpenChange(false);
      onCreated?.(created ?? undefined);
    } catch (err: any) {
      setError(err?.message || "Impossible de créer la visite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle visite"
      description="Enregistrez un passage patient au laboratoire."
      error={error}
      saving={saving}
      submitLabel="Créer la visite"
      onSubmit={submit}
    >
      <Field label="Patient" htmlFor="visit_patient">
        <select
          id="visit_patient"
          className={controlClass}
          value={form.patient_id}
          onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
          disabled={loadingPatients || saving}
        >
          <option value="">{loadingPatients ? "Chargement des patients…" : "Sélectionner un patient"}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Sans nom"}{p.matricule ? ` — ${p.matricule}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Date de la visite" htmlFor="visit_date">
          <input
            id="visit_date"
            type="date"
            className={controlClass}
            value={form.visit_date}
            onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Motif" htmlFor="visit_reason">
          <input
            id="visit_reason"
            className={controlClass}
            placeholder="Ex : contrôle, analyse de routine"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Notes" htmlFor="visit_notes" hint="Facultatif">
        <textarea
          id="visit_notes"
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#3D9597] focus:outline-none focus:ring-2 focus:ring-[#3D9597]/15"
          placeholder="Informations complémentaires…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}