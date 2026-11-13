"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

export type ConfigurationItem = {
  id: string;
  laboratory_id: string;
  category: string;
  code: string;
  label: string;
  description: string | null;
  unit: string | null;
  price: number;
  tax_rate: number;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

type ConfigurationItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  item?: ConfigurationItem | null;
  onSaved?: () => void;
};

type FormState = {
  code: string;
  label: string;
  description: string;
  unit: string;
  price: string;
  tax_rate: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  code: "",
  label: "",
  description: "",
  unit: "",
  price: "",
  tax_rate: "",
  sort_order: "0",
  is_active: true,
};

/** Catégories dont les items portent un prix (§ nomenclature des frais). */
const PRICED_CATEGORIES = new Set(["exam_type", "fee_type"]);
const UNIT_CATEGORIES = new Set(["sample_type", "unit"]);

export function ConfigurationItemFormDialog({
  open,
  onOpenChange,
  category,
  item,
  onSaved,
}: ConfigurationItemFormDialogProps) {
  const [form, setForm] = React.useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const editing = !!item;

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      item
        ? {
            code: item.code ?? "",
            label: item.label ?? "",
            description: item.description ?? "",
            unit: item.unit ?? "",
            price: item.price === null || item.price === undefined ? "" : String(item.price),
            tax_rate: item.tax_rate === null || item.tax_rate === undefined ? "" : String(item.tax_rate),
            sort_order: String(item.sort_order ?? 0),
            is_active: item.is_active,
          }
        : { ...emptyForm },
    );
  }, [open, item]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.code.trim()) {
      setError("Le code est requis");
      return;
    }
    if (!form.label.trim()) {
      setError("Le libellé est requis");
      return;
    }
    setSaving(true);
    try {
      if (editing && item) {
        await api.patch(`/configuration/${item.id}`, {
          label: form.label.trim(),
          description: form.description.trim() || null,
          unit: form.unit.trim() || null,
          price: form.price === "" ? 0 : Number(form.price),
          tax_rate: form.tax_rate === "" ? 0 : Number(form.tax_rate),
          sort_order: Number(form.sort_order || 0),
          is_active: form.is_active,
        });
      } else {
        await api.post("/configuration", {
          category,
          code: form.code.trim(),
          label: form.label.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || undefined,
          price: form.price === "" ? 0 : Number(form.price),
          tax_rate: form.tax_rate === "" ? 0 : Number(form.tax_rate),
          sort_order: Number(form.sort_order || 0),
          is_active: form.is_active,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      setError(err?.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const showPrice = PRICED_CATEGORIES.has(category);
  const showUnit = UNIT_CATEGORIES.has(category);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Modifier l'item" : "Nouvel item"}
      description="Ces valeurs alimentent les formulaires du laboratoire : plus aucune liste n'est figée dans l'interface."
      error={error}
      saving={saving}
      submitLabel={editing ? "Enregistrer" : "Créer l'item"}
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Code" htmlFor="config_code" hint="Identifiant unique dans la catégorie">
          <input
            id="config_code"
            className={controlClass}
            placeholder="Ex : NFS"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: editing ? form.code : e.target.value.toUpperCase() })}
            disabled={saving || editing}
          />
        </Field>
        <Field label="Libellé" htmlFor="config_label">
          <input
            id="config_label"
            className={controlClass}
            placeholder="Ex : Numération formule sanguine"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor="config_description" hint="Facultatif">
        <input
          id="config_description"
          className={controlClass}
          placeholder="Précisions affichées dans les formulaires"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          disabled={saving}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {showUnit ? (
          <Field label="Unité" htmlFor="config_unit" hint="Facultatif">
            <input
              id="config_unit"
              className={controlClass}
              placeholder="Ex : mL"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              disabled={saving}
            />
          </Field>
        ) : null}
        {showPrice ? (
          <Field label="Prix" htmlFor="config_price">
            <input
              id="config_price"
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
        ) : null}
        {showPrice ? (
          <Field label="Taxe (%)" htmlFor="config_tax">
            <input
              id="config_tax"
              type="number"
              min="0"
              max="100"
              step="0.1"
              className={controlClass}
              placeholder="0"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
              disabled={saving}
            />
          </Field>
        ) : null}
        <Field label="Ordre d'affichage" htmlFor="config_sort">
          <input
            id="config_sort"
            type="number"
            min="0"
            className={controlClass}
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Statut" htmlFor="config_active">
          <select
            id="config_active"
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