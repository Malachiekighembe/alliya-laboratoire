"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type ResultReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string | null;
  onDone?: () => void;
};

/** Demande de correction / reprise / rejet d'un résultat (§9.3). */
export function ResultReviewDialog({ open, onOpenChange, resultId, onDone }: ResultReviewDialogProps) {
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [action, setAction] = React.useState<"request-correction" | "request-rework" | "reject">("request-correction");

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    setError("");
    setAction("request-correction");
  }, [open, resultId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resultId) return;
    if (!reason.trim()) { setError("Le motif est requis"); return; }
    setSaving(true);
    try {
      await api.patch(`/results/${resultId}/${action}`, { reason: reason.trim() });
      onOpenChange(false);
      onDone?.();
    } catch (err: any) {
      setError(err?.message || "Opération impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Retour sur un résultat"
      description="Le technicien reçoit le motif et peut corriger ou reprendre l'analyse."
      error={error}
      saving={saving}
      submitLabel="Envoyer"
      onSubmit={submit}
    >
      <Field label="Type de retour" htmlFor="review_action">
        <select
          id="review_action"
          className={controlClass}
          value={action}
          onChange={(e) => setAction(e.target.value as typeof action)}
          disabled={saving}
        >
          <option value="request-correction">Demander une correction</option>
          <option value="request-rework">Demander une reprise</option>
          <option value="reject">Rejeter le résultat</option>
        </select>
      </Field>
      <Field label="Motif" htmlFor="review_reason">
        <textarea
          id="review_reason"
          rows={3}
          className={controlClass}
          placeholder="Valeur incohérente avec le contrôle qualité…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}