"use client";

import * as React from "react";
import Link from "next/link";
import { api, toList } from "@/lib/api-client";
import { useConfigurationOptions } from "@/lib/use-lab-options";
import { FormDialog, Field, controlClass } from "./form-dialog";

type PatientDocumentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  laboratoryId?: string | null;
  onCreated?: () => void;
};

const FALLBACK_TYPES = [
  { value: "bon_examen", label: "Bon d'examen" },
  { value: "ordonnance", label: "Ordonnance" },
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "facture", label: "Facture" },
];

export function PatientDocumentFormDialog({
  open,
  onOpenChange,
  patientId,
  laboratoryId,
  onCreated,
}: PatientDocumentFormDialogProps) {
  const { items: configItems } = useConfigurationOptions(open ? laboratoryId : null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);
  const [form, setForm] = React.useState({ document_type: "bon_examen", order_id: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const documentTypes = React.useMemo(() => {
    const configured = (configItems.document_type ?? [])
      .filter((item: any) => item.is_active !== false)
      .map((item: any) => ({ value: item.code, label: item.label || item.code }));
    return configured.length ? configured : FALLBACK_TYPES;
  }, [configItems]);

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ document_type: documentTypes[0]?.value || "bon_examen", order_id: "" });
  }, [open, documentTypes]);

  React.useEffect(() => {
    if (!open || !patientId) return;
    let cancelled = false;
    (async () => {
      setLoadingOrders(true);
      try {
        const query = `/orders?patient_id=${patientId}&limit=50${laboratoryId ? `&laboratory_id=${laboratoryId}` : ""}`;
        const res = await api.safeGet<any>(query);
        if (!cancelled) setOrders(toList(res.data));
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, patientId, laboratoryId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/patient-documents", {
        patient_id: patientId,
        order_id: form.order_id || undefined,
        document_type: form.document_type,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Création du document impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau document"
      description="Le contenu est figé au moment de la création : les modifications ultérieures de la demande ne l'altèrent pas."
      error={error}
      saving={saving}
      submitLabel="Générer le document"
      onSubmit={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Type de document" htmlFor="doc_type">
          <select
            id="doc_type"
            className={controlClass}
            value={form.document_type}
            onChange={(e) => setForm({ ...form, document_type: e.target.value })}
            disabled={saving}
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Demande liée" htmlFor="doc_order" hint="Le bon d'examen reprend les examens de la demande.">
          <select
            id="doc_order"
            className={controlClass}
            value={form.order_id}
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            disabled={saving || loadingOrders}
          >
            <option value="">{loadingOrders ? "Chargement des demandes…" : "Aucune demande"}</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.matricule}
                {order.order_date ? ` — ${new Date(order.order_date).toLocaleDateString("fr-FR")}` : ""}
                {order.status ? ` (${String(order.status).replace(/_/g, " ")})` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {orders.length === 0 && !loadingOrders ? (
        <p className="text-[11px] text-slate-500">
          Aucune demande enregistrée pour ce patient. Vous pouvez en créer une depuis{" "}
          <Link href="/visites" className="underline">les visites</Link>.
        </p>
      ) : null}
    </FormDialog>
  );
}