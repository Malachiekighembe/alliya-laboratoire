"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type TestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  onCreated?: () => void;
};

const emptyTest = { code: "", name: "", category: "", unit: "", reference_range: "", price: "", duration_minutes: "", is_active: true };

export function TestFormDialog({ open, onOpenChange, laboratoryId, onCreated }: TestFormDialogProps) {
  const [form, setForm] = React.useState({ ...emptyTest });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ ...emptyTest });
  }, [open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/examinations", {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        unit: form.unit.trim() || undefined,
        reference_range: form.reference_range.trim() || undefined,
        price: form.price === "" ? undefined : Number(form.price),
        duration_minutes: form.duration_minutes === "" ? undefined : Number(form.duration_minutes),
        is_active: form.is_active,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Impossible de créer l'analyse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle analyse"
      description={laboratoryId ? "Ajoutez un examen au catalogue du laboratoire." : "Ajoutez un examen au catalogue."}
      error={error}
      saving={saving}
      submitLabel="Créer l'analyse"
      size="lg"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Code" htmlFor="test_code">
          <input
            id="test_code"
            className={controlClass}
            placeholder="Ex : NFS"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            disabled={saving}
          />
        </Field>
        <Field label="Nom de l'examen" htmlFor="test_name">
          <input
            id="test_name"
            className={controlClass}
            placeholder="Ex : Numération formule sanguine"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Catégorie" htmlFor="test_category" hint="Facultatif">
          <input
            id="test_category"
            className={controlClass}
            placeholder="Ex : Hématologie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Unité" htmlFor="test_unit" hint="Facultatif">
          <input
            id="test_unit"
            className={controlClass}
            placeholder="Ex : g/dL"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Valeurs de référence" htmlFor="test_range" hint="Facultatif">
        <input
          id="test_range"
          className={controlClass}
          placeholder="Ex : 4,0 – 11,0"
          value={form.reference_range}
          onChange={(e) => setForm({ ...form, reference_range: e.target.value })}
          disabled={saving}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label="Prix" htmlFor="test_price" hint="Facultatif">
          <input
            id="test_price"
            type="number"
            min="0"
            step="0.01"
            className={controlClass}
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Durée (min)" htmlFor="test_duration" hint="Facultatif">
          <input
            id="test_duration"
            type="number"
            min="0"
            className={controlClass}
            placeholder="30"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Statut" htmlFor="test_active">
          <select
            id="test_active"
            className={controlClass}
            value={form.is_active ? "true" : "false"}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
            disabled={saving}
          >
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </Field>
      </div>
    </FormDialog>
  );
}