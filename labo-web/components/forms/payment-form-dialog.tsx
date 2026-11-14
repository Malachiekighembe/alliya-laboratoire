"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type PaymentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null;
  onSaved?: () => void;
};

const METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte bancaire" },
  { value: "transfer", label: "Virement" },
  { value: "check", label: "Chèque" },
  { value: "insurance", label: "Assurance" },
];

const currencyOf = (inv: any) => inv?.currency || "USD";

export function PaymentFormDialog({ open, onOpenChange, invoice, onSaved }: PaymentFormDialogProps) {
  const balance = Math.max(
    Number(invoice?.total ?? 0) - Number(invoice?.amount_paid ?? 0),
    0,
  );
  const [form, setForm] = React.useState({ amount: "", method: "cash", reference: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      amount: balance > 0 ? balance.toFixed(2) : "",
      method: "cash",
      reference: "",
    });
  }, [open, invoice, balance]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice?.id) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Le montant doit être supérieur à 0"); return; }

    setSaving(true);
    try {
      await api.post(`/billing/${invoice.id}/payments`, {
        idempotency_key: `pay-${invoice.id}-${Date.now()}`,
        amount,
        method: form.method,
        currency: currencyOf(invoice),
        reference: form.reference.trim() || undefined,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      setError(err?.message || "Encaissement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Encaisser un paiement"
      description={invoice ? `${invoice.invoice_number || "Facture"} — solde ${balance.toLocaleString("fr-FR")} ${currencyOf(invoice)}` : undefined}
      error={error}
      saving={saving}
      submitLabel="Encaisser"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Montant" htmlFor="pay_amount" hint={balance > 0 ? `Solde : ${balance.toLocaleString("fr-FR")} ${currencyOf(invoice)}` : undefined}>
          <input
            id="pay_amount"
            type="number"
            min="0"
            step="0.01"
            className={controlClass}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Mode de paiement" htmlFor="pay_method">
          <select
            id="pay_method"
            className={controlClass}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            disabled={saving}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Référence" htmlFor="pay_reference" hint="Facultatif — n° de chèque, transaction…">
        <input
          id="pay_reference"
          className={controlClass}
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}