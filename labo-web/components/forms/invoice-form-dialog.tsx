"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useConfigurationOptions, useLabPatients, useTestCatalog } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string;
  onCreated?: () => void;
};

type Line = { description: string; quantity: string; unit_price: string; test_catalog_id: string; fee_type: string };

const emptyLine: Line = { description: "", quantity: "1", unit_price: "", test_catalog_id: "", fee_type: "" };

export function InvoiceFormDialog({ open, onOpenChange, laboratoryId, patientId, onCreated }: InvoiceFormDialogProps) {
  const { patients, loading: loadingPatients } = useLabPatients(open ? laboratoryId : null);
  const { tests, loading: loadingTests } = useTestCatalog(open ? laboratoryId : null);
  const { items } = useConfigurationOptions(open ? laboratoryId : null);
  const [form, setForm] = React.useState({ patient_id: patientId || "", due_date: "", currency: "USD", notes: "" });
  const [lines, setLines] = React.useState<Line[]>([{ ...emptyLine }]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const feeTypes = React.useMemo(
    () =>
      (items.fee_type ?? [])
        .filter((item: any) => item.is_active !== false)
        .map((item: any) => ({ value: String(item.code), label: String(item.label || item.code) })),
    [items],
  );

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ patient_id: patientId || "", due_date: "", currency: "USD", notes: "" });
    setLines([{ ...emptyLine }]);
  }, [open, patientId]);

  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0), 0);

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const pickTest = (index: number, testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) { updateLine(index, { test_catalog_id: "", fee_type: "autre" }); return; }
    updateLine(index, {
      test_catalog_id: test.id,
      description: test.name || test.code || "",
      unit_price: test.price !== undefined && test.price !== null ? String(test.price) : "",
      fee_type: "analyse",
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const items = lines
        .filter((line) => line.description.trim() && Number(line.unit_price) >= 0 && line.unit_price !== "")
        .map((line) => ({
          description: line.description.trim(),
          quantity: Number(line.quantity) || 1,
          unit_price: String(line.unit_price),
          fee_type: line.fee_type || (line.test_catalog_id ? "analyse" : "autre"),
          ...(line.test_catalog_id ? { test_catalog_id: line.test_catalog_id } : {}),
        }));

      await api.post("/billing", {
        patient_id: form.patient_id || undefined,
        due_date: form.due_date ? new Date(`${form.due_date}T00:00:00`).toISOString() : undefined,
        currency: form.currency || "USD",
        notes: form.notes.trim() || undefined,
        items,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Impossible de créer la facture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle facture"
      description="Facturez un patient avec une ou plusieurs prestations."
      error={error}
      saving={saving}
      submitLabel="Créer la facture"
      size="lg"
      onSubmit={submit}
    >
      <Field label="Patient" htmlFor="invoice_patient">
        <select
          id="invoice_patient"
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
        <Field label="Échéance" htmlFor="invoice_due" hint="Facultatif">
          <input
            id="invoice_due"
            type="date"
            className={controlClass}
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Devise" htmlFor="invoice_currency">
          <input
            id="invoice_currency"
            className={controlClass}
            placeholder="USD"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            disabled={saving}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-slate-700">Prestations</p>
          <span className="text-[11px] text-slate-400">{loadingTests ? "Chargement du catalogue…" : `${tests.length} examen(s)`}</span>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 sm:p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-[1.5fr_.9fr_1.2fr_.5fr_.7fr_auto] sm:items-end">
              <Field label={index === 0 ? "Examen" : "\u00A0"} htmlFor={`line_test_${index}`}>
                <select
                  id={`line_test_${index}`}
                  className={controlClass}
                  value={line.test_catalog_id}
                  onChange={(e) => pickTest(index, e.target.value)}
                  disabled={saving || loadingTests}
                >
                  <option value="">Saisie libre…</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.code}{t.price !== undefined ? ` — ${t.price}` : ""}</option>
                  ))}
                </select>
              </Field>
              <Field label={index === 0 ? "Type de frais" : "\u00A0"} htmlFor={`line_fee_${index}`}>
                <select
                  id={`line_fee_${index}`}
                  className={controlClass}
                  value={line.fee_type}
                  onChange={(e) => updateLine(index, { fee_type: e.target.value })}
                  disabled={saving}
                >
                  <option value="">—</option>
                  {feeTypes.map((fee) => (
                    <option key={fee.value} value={fee.value}>{fee.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={index === 0 ? "Description" : "\u00A0"} htmlFor={`line_desc_${index}`}>
                <input
                  id={`line_desc_${index}`}
                  className={controlClass}
                  placeholder="Prestation"
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <Field label={index === 0 ? "Qté" : "\u00A0"} htmlFor={`line_qty_${index}`}>
                <input
                  id={`line_qty_${index}`}
                  type="number"
                  min="1"
                  className={controlClass}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <Field label={index === 0 ? "Prix unitaire" : "\u00A0"} htmlFor={`line_price_${index}`}>
                <input
                  id={`line_price_${index}`}
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
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs font-medium text-slate-600 transition-colors hover:border-[#3D9597] hover:text-[#2E7A7C]"
          disabled={saving}
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une prestation
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#F5F8FA] px-3 py-2.5">
        <span className="text-xs sm:text-sm text-slate-500">Total estimé</span>
        <span className="text-sm sm:text-base font-semibold text-[#1E2A47]">{total.toLocaleString("fr-FR")} {form.currency}</span>
      </div>

      <Field label="Notes" htmlFor="invoice_notes" hint="Facultatif">
        <textarea
          id="invoice_notes"
          rows={2}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#3D9597] focus:outline-none focus:ring-2 focus:ring-[#3D9597]/15"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}