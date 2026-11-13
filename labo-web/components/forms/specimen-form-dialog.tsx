"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { useLabPatients } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

const SPECIMEN_TYPES = [
  { value: "sang", label: "Sang" },
  { value: "urine", label: "Urine" },
  { value: "selles", label: "Selles" },
  { value: "salive", label: "Salive" },
  { value: "autre", label: "Autre" },
];

type SpecimenFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string;
  onCreated?: () => void;
};

export function SpecimenFormDialog({ open, onOpenChange, laboratoryId, patientId, onCreated }: SpecimenFormDialogProps) {
  const { patients, loading: loadingPatients } = useLabPatients(open ? laboratoryId : null);
  const [form, setForm] = React.useState({ patient_id: patientId || "", type: "sang", container: "", notes: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ patient_id: patientId || "", type: "sang", container: "", notes: "" });
  }, [open, patientId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/specimens", {
        patient_id: form.patient_id || undefined,
        type: form.type,
        container: form.container.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Impossible de créer le prélèvement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau prélèvement"
      description="Enregistrez un échantillon à analyser."
      error={error}
      saving={saving}
      submitLabel="Créer le prélèvement"
      onSubmit={submit}
    >
      <Field label="Patient" htmlFor="specimen_patient">
        <select
          id="specimen_patient"
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
        <Field label="Type d'échantillon" htmlFor="specimen_type">
          <select
            id="specimen_type"
            className={controlClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            disabled={saving}
          >
            {SPECIMEN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Contenant" htmlFor="specimen_container" hint="Facultatif">
          <input
            id="specimen_container"
            className={controlClass}
            placeholder="Ex : tube EDTA, flacon stérile"
            value={form.container}
            onChange={(e) => setForm({ ...form, container: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Notes" htmlFor="specimen_notes" hint="Facultatif">
        <textarea
          id="specimen_notes"
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#3D9597] focus:outline-none focus:ring-2 focus:ring-[#3D9597]/15"
          placeholder="Conditions de collecte, jeûne…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}