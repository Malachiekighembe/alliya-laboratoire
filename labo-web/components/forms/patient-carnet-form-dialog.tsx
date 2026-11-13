"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { useLabPatients } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type PatientCarnetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string;
  onCreated?: () => void;
};

export function PatientCarnetFormDialog({ open, onOpenChange, laboratoryId, patientId, onCreated }: PatientCarnetFormDialogProps) {
  const { patients, loading: loadingPatients } = useLabPatients(open ? laboratoryId : null);
  const [form, setForm] = React.useState({ patient_id: patientId || "", matricule: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    const selected = patients.find((p) => p.id === patientId);
    setForm({ patient_id: patientId || "", matricule: selected?.matricule || "" });
  }, [open, patientId, patients]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/patient-carnets", {
        patient_id: form.patient_id || undefined,
        laboratory_id: laboratoryId,
        matricule: form.matricule.trim() || undefined,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Impossible de créer le dossier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau dossier patient"
      description="Ouvrez un carnet de suivi pour un patient."
      error={error}
      saving={saving}
      submitLabel="Créer le dossier"
      onSubmit={submit}
    >
      <Field label="Patient" htmlFor="carnet_patient">
        <select
          id="carnet_patient"
          className={controlClass}
          value={form.patient_id}
          onChange={(e) => {
            const next = e.target.value;
            const selected = patients.find((p) => p.id === next);
            setForm({ patient_id: next, matricule: selected?.matricule || "" });
          }}
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
      <Field label="Matricule du carnet" htmlFor="carnet_matricule" hint="Généré automatiquement si laissé vide">
        <input
          id="carnet_matricule"
          className={controlClass}
          placeholder="Auto"
          value={form.matricule}
          onChange={(e) => setForm({ ...form, matricule: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}