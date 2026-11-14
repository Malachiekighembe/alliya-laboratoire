"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { useConfigurationOptions } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type TestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  test?: any | null;
  onSaved?: (created?: any) => void;
};

type FormState = {
  code: string;
  name: string;
  exam_type: string;
  section: string;
  sample_type: string;
  container: string;
  preparation: string;
  method: string;
  description: string;
  unit: string;
  reference_range: string;
  price: string;
  duration_minutes: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  exam_type: "",
  section: "",
  sample_type: "",
  container: "",
  preparation: "",
  method: "",
  description: "",
  unit: "",
  reference_range: "",
  price: "",
  duration_minutes: "",
  is_active: true,
};

/** Options d'un item de configuration : valeur = code, libellé affiché. */
function options(items: any[] | undefined) {
  return (items ?? [])
    .filter((item: any) => item.is_active !== false)
    .map((item: any) => ({ value: String(item.code), label: String(item.label || item.code) }));
}

export function TestFormDialog({ open, onOpenChange, laboratoryId, test, onSaved }: TestFormDialogProps) {
  const { items } = useConfigurationOptions(open ? laboratoryId : null);
  const [form, setForm] = React.useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const examTypes = React.useMemo(() => options(items.exam_type), [items]);
  const sections = React.useMemo(() => options(items.section), [items]);
  const sampleTypes = React.useMemo(() => options(items.sample_type), [items]);
  const units = React.useMemo(() => options(items.unit), [items]);

  React.useEffect(() => {
    if (!open) return;
    setError("");
    if (test) {
      setForm({
        code: test.code ?? "",
        name: test.name ?? "",
        exam_type: test.exam_type ?? "",
        section: test.section ?? "",
        sample_type: test.sample_type ?? "",
        container: test.container ?? "",
        preparation: test.preparation ?? "",
        method: test.method ?? "",
        description: test.description ?? "",
        unit: test.unit ?? "",
        reference_range: test.reference_range ?? "",
        price: test.price === null || test.price === undefined ? "" : String(test.price),
        duration_minutes: test.duration_minutes === null || test.duration_minutes === undefined ? "" : String(test.duration_minutes),
        is_active: test.is_active !== false,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [open, test]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.code.trim()) { setError("Le code est requis"); return; }
    if (!form.name.trim()) { setError("Le nom est requis"); return; }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      exam_type: form.exam_type || undefined,
      section: form.section || undefined,
      sample_type: form.sample_type || undefined,
      container: form.container.trim() || undefined,
      preparation: form.preparation.trim() || undefined,
      method: form.method.trim() || undefined,
      description: form.description.trim() || undefined,
      unit: form.unit || undefined,
      reference_range: form.reference_range.trim() || undefined,
      price: form.price === "" ? undefined : Number(form.price),
      duration_minutes: form.duration_minutes === "" ? undefined : Number(form.duration_minutes),
    };

    setSaving(true);
    try {
      let created: any = null;
      if (test?.id) {
        created = (await api.patch(`/examinations/${test.id}`, { ...payload, is_active: form.is_active }))?.data ?? null;
      } else {
        created = (await api.post("/examinations", { ...payload, is_active: form.is_active }))?.data ?? null;
      }
      onOpenChange(false);
      onSaved?.(created ?? undefined);
    } catch (err: any) {
      setError(err?.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={test?.id ? "Modifier l'examen" : "Nouvel examen"}
      description="L'examen alimente les demandes, le catalogue, les bons d'examen et la facturation."
      error={error}
      saving={saving}
      submitLabel={test?.id ? "Enregistrer" : "Créer l'examen"}
      size="lg"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label="Code" htmlFor="test_code" hint="Unique par laboratoire">
          <input
            id="test_code"
            className={controlClass}
            placeholder="NFS"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            disabled={saving || !!test?.id}
          />
        </Field>
        <Field label="Nom de l'examen" htmlFor="test_name" className="sm:col-span-2">
          <input
            id="test_name"
            className={controlClass}
            placeholder="Numération formule sanguine"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label="Type d'examen" htmlFor="test_exam_type">
          <select
            id="test_exam_type"
            className={controlClass}
            value={form.exam_type}
            onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {examTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Section technique" htmlFor="test_section">
          <select
            id="test_section"
            className={controlClass}
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {sections.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Échantillon" htmlFor="test_sample_type">
          <select
            id="test_sample_type"
            className={controlClass}
            value={form.sample_type}
            onChange={(e) => setForm({ ...form, sample_type: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {sampleTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label="Contenant" htmlFor="test_container" hint="Facultatif">
          <input
            id="test_container"
            className={controlClass}
            placeholder="Tube EDTA"
            value={form.container}
            onChange={(e) => setForm({ ...form, container: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Préparation patient" htmlFor="test_preparation" hint="Facultatif">
          <input
            id="test_preparation"
            className={controlClass}
            placeholder="À jeun 12 h"
            value={form.preparation}
            onChange={(e) => setForm({ ...form, preparation: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Méthode" htmlFor="test_method" hint="Facultatif">
          <input
            id="test_method"
            className={controlClass}
            placeholder="Spectrophotométrie"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            disabled={saving}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 sm:gap-4">
        <Field label="Unité" htmlFor="test_unit">
          <select
            id="test_unit"
            className={controlClass}
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {units.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            {form.unit && !units.some((option) => option.value === form.unit) ? (
              <option value={form.unit}>{form.unit}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Valeurs de référence" htmlFor="test_range" className="sm:col-span-2">
          <input
            id="test_range"
            className={controlClass}
            placeholder="4,0 – 11,0"
            value={form.reference_range}
            onChange={(e) => setForm({ ...form, reference_range: e.target.value })}
            disabled={saving}
          />
        </Field>
        <Field label="Durée (min)" htmlFor="test_duration">
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Prix" htmlFor="test_price">
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

      <Field label="Description" htmlFor="test_description" hint="Facultatif">
        <textarea
          id="test_description"
          rows={2}
          className={controlClass}
          placeholder="Indications, particularités…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          disabled={saving}
        />
      </Field>
    </FormDialog>
  );
}