"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type AppointmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  onCreated?: (created?: any) => void;
};

const emptyForm = { patient_id: "", appointment_date: "", reason: "", notes: "" };

export function AppointmentFormDialog({
  open,
  onOpenChange,
  laboratoryId,
  onCreated,
}: AppointmentFormDialogProps) {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ ...emptyForm });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ ...emptyForm });
    if (!laboratoryId) return;
    api
      .safeGet<any>(`/patients?laboratory_id=${laboratoryId}`)
      .then((res) => {
        const payload: any = res.data;
        const list = Array.isArray(payload) ? payload : (payload?.data ?? []);
        setPatients(Array.isArray(list) ? list : []);
      });
  }, [open, laboratoryId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.patient_id) { setError("Sélectionnez un patient."); return; }
    if (!form.appointment_date) { setError("La date du rendez-vous est requise."); return; }
    setSaving(true);
    try {
      const res = await api.post<any>("/appointments", {
        patient_id: form.patient_id,
        appointment_date: new Date(form.appointment_date).toISOString(),
        reason: form.reason.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      const created = res?.data ?? null;
      onOpenChange(false);
      onCreated?.(created ?? undefined);
    } catch (err: any) {
      setError(err?.message || "Impossible de créer le rendez-vous");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau rendez-vous"
      description="Planifiez un passage patient au laboratoire."
      error={error}
      saving={saving}
      submitLabel="Créer le rendez-vous"
      size="lg"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Patient" htmlFor="rdv_patient">
          <select
            id="rdv_patient"
            className={controlClass}
            value={form.patient_id}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
            disabled={saving}
          >
            <option value="">Sélectionner…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ")} {p.matricule ? `(${p.matricule})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date et heure" htmlFor="rdv_date">
          <input
            id="rdv_date"
            type="datetime-local"
            className={controlClass}
            value={form.appointment_date}
            onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Motif" htmlFor="rdv_reason" hint="Facultatif">
        <input
          id="rdv_reason"
          className={controlClass}
          placeholder="Ex : contrôle, prélèvement…"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          disabled={saving}
        />
      </Field>
      <Field label="Notes" htmlFor="rdv_notes" hint="Facultatif">
        <textarea
          id="rdv_notes"
          className={controlClass + " h-20 py-2"}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}