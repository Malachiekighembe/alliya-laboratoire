"use client";

import * as React from "react";
import { api, toList } from "@/lib/api-client";
import { FormDialog, Field, controlClass } from "./form-dialog";

type ResultFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratoryId?: string | null;
  patientId?: string | null;
  specimenId?: string | null;
  testId?: string | null;
  result?: any | null;
  onSaved?: (created?: any) => void;
};

const RESULT_TYPES = [
  { value: "numeric", label: "Numérique" },
  { value: "text", label: "Texte libre" },
  { value: "qualitative", label: "Qualitatif" },
  { value: "table", label: "Tableau de paramètres" },
];

const patientLabel = (p: any) =>
  `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.matricule || "Patient";

export function ResultFormDialog({
  open,
  onOpenChange,
  laboratoryId,
  patientId,
  specimenId,
  testId,
  result,
  onSaved,
}: ResultFormDialogProps) {
  const readOnly = !!result?.id && result.status !== "brouillon" && result.status !== "a_corriger";

  const [patients, setPatients] = React.useState<any[]>([]);
  const [tests, setTests] = React.useState<any[]>([]);
  const [specimens, setSpecimens] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({
    patient_id: "",
    specimen_id: "",
    test_catalog_id: "",
    result_type: "numeric",
    value: "",
    qualitative_value: "",
    unit: "",
    reference_range: "",
    method: "",
    observations: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open || !laboratoryId) return;
    void (async () => {
      const [pat, exam] = await Promise.all([
        api.safeGet<any>(`/patients?laboratory_id=${laboratoryId}&limit=100`),
        api.safeGet<any>(`/examinations?laboratory_id=${laboratoryId}&limit=100`),
      ]);
      setPatients(toList<any>(pat.data));
      setTests(toList<any>(exam.data).filter((t: any) => t.is_active !== false));
    })();
  }, [open, laboratoryId]);

  const specimenPatientId = result?.specimen_id ? result?.specimen?.patient_id || result?.patient_id : undefined;

  React.useEffect(() => {
    if (!open) return;
    setError("");
    if (result?.id) {
      setForm({
        patient_id: specimenPatientId || result?.patient_id || "",
        specimen_id: result.specimen_id || "",
        test_catalog_id: result.test_catalog_id || "",
        result_type: result.result_type || "numeric",
        value: result.value ?? "",
        qualitative_value: result.qualitative_value ?? "",
        unit: result.unit || result.test_catalog?.unit || "",
        reference_range: result.reference_range || result.test_catalog?.reference_range || "",
        method: result.method || result.test_catalog?.method || "",
        observations: result.observations || result.comments || "",
      });
    } else {
      const presetTest = testId ? tests.find((t: any) => t.id === testId) : null;
      setForm({
        patient_id: patientId || "",
        specimen_id: specimenId || "",
        test_catalog_id: testId || "",
        result_type: "numeric",
        value: "",
        qualitative_value: "",
        unit: presetTest?.unit || "",
        reference_range: presetTest?.reference_range || "",
        method: presetTest?.method || "",
        observations: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result, patientId, specimenId, testId]);

  // Pré-remplissage depuis un prélèvement : on récupère le patient rattaché.
  React.useEffect(() => {
    if (!open || !laboratoryId || result?.id || !specimenId) return;
    void (async () => {
      const res = await api.safeGet<any>(`/specimens/${specimenId}?laboratory_id=${laboratoryId}`);
      const patient_id = res.data?.patient_id;
      if (patient_id) setForm((prev) => ({ ...prev, patient_id: prev.patient_id || patient_id }));
    })();
  }, [open, laboratoryId, specimenId, result?.id]);

  const activePatientId = form.patient_id || specimenPatientId;

  React.useEffect(() => {
    if (!open || !laboratoryId || !activePatientId) { setSpecimens([]); return; }
    void (async () => {
      const res = await api.safeGet<any>(
        `/specimens?laboratory_id=${laboratoryId}&patient_id=${activePatientId}&limit=100`,
      );
      setSpecimens(toList<any>(res.data));
    })();
  }, [open, laboratoryId, activePatientId]);

  const selectedTest = React.useMemo(
    () => tests.find((t: any) => t.id === form.test_catalog_id) ?? null,
    [tests, form.test_catalog_id],
  );

  const applyTestDefaults = (testId: string) => {
    const test = tests.find((t: any) => t.id === testId) ?? null;
    setForm((prev) => ({
      ...prev,
      test_catalog_id: testId,
      unit: test?.unit || prev.unit,
      reference_range: test?.reference_range || prev.reference_range,
      method: test?.method || prev.method,
    }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.specimen_id) { setError("Sélectionnez l'échantillon à analyser"); return; }
    if (!form.test_catalog_id) { setError("Sélectionnez l'examen"); return; }

    const payload: Record<string, any> = {
      specimen_id: form.specimen_id,
      test_catalog_id: form.test_catalog_id,
      result_type: form.result_type,
      unit: form.unit.trim() || undefined,
      reference_range: form.reference_range.trim() || undefined,
      method: form.method.trim() || undefined,
      observations: form.observations.trim() || undefined,
    };
    if (form.result_type === "qualitative") {
      payload.qualitative_value = form.qualitative_value;
    } else if (form.result_type === "text") {
      payload.value = form.value;
    } else {
      payload.value = form.value;
    }

    setSaving(true);
    try {
      let created: any = null;
      if (result?.id) {
        created = (await api.patch(`/results/${result.id}`, payload))?.data ?? null;
      } else {
        created = (await api.post("/results", payload))?.data ?? null;
      }
      onOpenChange(false);
      onSaved?.(created ?? undefined);
    } catch (err: any) {
      setError(err?.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const isNumeric = form.result_type === "numeric" || form.result_type === "text" || form.result_type === "table";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={readOnly ? "Résultat" : result?.id ? "Modifier le résultat" : "Saisir un résultat"}
      description={readOnly ? "Ce résultat n'est plus modifiable (soumis ou validé)." : "Le résultat est rattaché à l'échantillon prélevé pour le patient."}
      error={error}
      saving={saving}
      submitLabel={result?.id ? "Enregistrer" : "Enregistrer le résultat"}
      size="lg"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Patient" htmlFor="res_patient" hint="Filtre les échantillons disponibles">
          <select
            id="res_patient"
            className={controlClass}
            value={activePatientId || ""}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value, specimen_id: "" })}
            disabled={saving || readOnly || !!result?.id}
          >
            <option value="">— Sélectionner —</option>
            {patients.map((p: any) => (
              <option key={p.id} value={p.id}>{`${patientLabel(p)}${p.matricule ? ` (${p.matricule})` : ""}`}</option>
            ))}
          </select>
        </Field>
        <Field label="Échantillon" htmlFor="res_specimen">
          <select
            id="res_specimen"
            className={controlClass}
            value={form.specimen_id}
            onChange={(e) => setForm({ ...form, specimen_id: e.target.value })}
            disabled={saving || readOnly || !!result?.id}
          >
            <option value="">{activePatientId ? "— Sélectionner —" : "Choisissez d'abord un patient"}</option>
            {specimens.map((s: any) => (
              <option key={s.id} value={s.id}>
                {`${s.matricule || s.id.slice(0, 8)} · ${s.type || "échantillon"}${s.status ? ` · ${s.status}` : ""}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label="Examen" htmlFor="res_test" className="sm:col-span-2">
          <select
            id="res_test"
            className={controlClass}
            value={form.test_catalog_id}
            onChange={(e) => applyTestDefaults(e.target.value)}
            disabled={saving || readOnly || !!result?.id}
          >
            <option value="">— Sélectionner —</option>
            {tests.map((t: any) => (
              <option key={t.id} value={t.id}>{`${t.name}${t.code ? ` (${t.code})` : ""}`}</option>
            ))}
          </select>
        </Field>
        <Field label="Type de saisie" htmlFor="res_type">
          <select
            id="res_type"
            className={controlClass}
            value={form.result_type}
            onChange={(e) => setForm({ ...form, result_type: e.target.value })}
            disabled={saving || readOnly}
          >
            {RESULT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 sm:gap-4">
        {form.result_type === "qualitative" ? (
          <Field label="Résultat" htmlFor="res_qual" className="sm:col-span-2">
            <select
              id="res_qual"
              className={controlClass}
              value={form.qualitative_value}
              onChange={(e) => setForm({ ...form, qualitative_value: e.target.value })}
              disabled={saving || readOnly}
            >
              <option value="">— Sélectionner —</option>
              <option value="positif">Positif</option>
              <option value="negatif">Négatif</option>
              <option value="douteux">Douteux</option>
              <option value="non_detecte">Non détecté</option>
              <option value="detecte">Détecté</option>
            </select>
          </Field>
        ) : (
          <Field label="Valeur" htmlFor="res_value" className="sm:col-span-2" hint={isNumeric ? "Valeur mesurée" : "Texte du résultat"}>
            <input
              id="res_value"
              className={controlClass}
              placeholder={isNumeric ? "0,00" : "Résultat"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              disabled={saving || readOnly}
            />
          </Field>
        )}
        <Field label="Unité" htmlFor="res_unit" hint={selectedTest?.unit ? `Défaut : ${selectedTest.unit}` : undefined}>
          <input
            id="res_unit"
            className={controlClass}
            placeholder="g/dL"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            disabled={saving || readOnly}
          />
        </Field>
        <Field label="Valeurs de référence" htmlFor="res_range">
          <input
            id="res_range"
            className={controlClass}
            placeholder="4,0 – 11,0"
            value={form.reference_range}
            onChange={(e) => setForm({ ...form, reference_range: e.target.value })}
            disabled={saving || readOnly}
          />
        </Field>
      </div>

      <Field label="Méthode" htmlFor="res_method" hint="Facultatif — reprise de l'examen si défini">
        <input
          id="res_method"
          className={controlClass}
          placeholder="Spectrophotométrie"
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
          disabled={saving || readOnly}
        />
      </Field>

      <Field label="Observations" htmlFor="res_obs" hint="Facultatif — visible sur le compte rendu">
        <textarea
          id="res_obs"
          rows={2}
          className={controlClass}
          placeholder="Remarques techniques, interprétation…"
          value={form.observations}
          onChange={(e) => setForm({ ...form, observations: e.target.value })}
          disabled={saving || readOnly}
        />
      </Field>
    </FormDialog>
  );
}