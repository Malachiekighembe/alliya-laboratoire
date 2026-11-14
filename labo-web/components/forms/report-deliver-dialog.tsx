"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type ReportDeliverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any | null;
  onSaved?: () => void;
};

const RELATIONS = [
  { value: "patient", label: "Patient" },
  { value: "parent", label: "Parent" },
  { value: "tuteur", label: "Tuteur" },
  { value: "medecin", label: "Médecin" },
  { value: "autre", label: "Autre" },
];

const MODES = [
  { value: "remise_en_main_propre", label: "Remise en main propre" },
  { value: "email", label: "Email" },
  { value: "retrait", label: "Retrait sur place" },
  { value: "envoi", label: "Envoi postal" },
];

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReportDeliverDialog({ open, onOpenChange, report, onSaved }: ReportDeliverDialogProps) {
  const [form, setForm] = React.useState({
    recipient_name: "",
    recipient_relation: "patient",
    delivery_mode: "remise_en_main_propre",
    delivered_at: toLocalDatetimeString(new Date()),
    notes: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      recipient_name: "",
      recipient_relation: "patient",
      delivery_mode: "remise_en_main_propre",
      delivered_at: toLocalDatetimeString(new Date()),
      notes: "",
    });
  }, [open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report?.id) return;
    if (!form.recipient_name.trim()) { setError("Le nom du destinataire est requis"); return; }

    setSaving(true);
    try {
      const deliveredAt = new Date(form.delivered_at).toISOString();
      await api.post(`/reports/${report.id}/deliver?laboratory_id=${report.laboratory_id}`, {
        recipient_name: form.recipient_name.trim(),
        recipient_relation: form.recipient_relation,
        delivery_mode: form.delivery_mode,
        delivered_at: deliveredAt,
        notes: form.notes.trim() || undefined,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      setError(err?.message || "Livraison impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Livrer le rapport"
      description={report ? `${report.matricule || "Rapport"} — ${report.patient_name || "Patient"}` : undefined}
      error={error}
      saving={saving}
      submitLabel="Livrer"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Destinataire" htmlFor="deliver_recipient">
          <input
            id="deliver_recipient"
            className={controlClass}
            value={form.recipient_name}
            onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
            disabled={saving}
            placeholder="Nom complet"
          />
        </Field>
        <Field label="Lien" htmlFor="deliver_relation">
          <select
            id="deliver_relation"
            className={controlClass}
            value={form.recipient_relation}
            onChange={(e) => setForm({ ...form, recipient_relation: e.target.value })}
            disabled={saving}
          >
            {RELATIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Mode de livraison" htmlFor="deliver_mode">
          <select
            id="deliver_mode"
            className={controlClass}
            value={form.delivery_mode}
            onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}
            disabled={saving}
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Date / heure" htmlFor="deliver_date" hint="Format local, converti en UTC">
          <input
            id="deliver_date"
            type="datetime-local"
            className={controlClass}
            value={form.delivered_at}
            onChange={(e) => setForm({ ...form, delivered_at: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Notes" htmlFor="deliver_notes" hint="Facultatif">
        <textarea
          id="deliver_notes"
          className={controlClass}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
          placeholder="Observations..."
        />
      </Field>
    </FormDialog>
  );
}
