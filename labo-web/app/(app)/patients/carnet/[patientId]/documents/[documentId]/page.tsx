"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Printer } from "lucide-react";

type PatientDocument = {
  id: string;
  title: string;
  reference: string | null;
  document_type: string;
  content: any;
  printed_at: string | null;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  bon_examen: "Bon d'examen",
  ordonnance: "Ordonnance",
  compte_rendu: "Compte rendu",
  facture: "Facture",
};

function money(amount: any, currency: string) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "USD" }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
}

function line(value: any) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default function PatientDocumentPrintPage() {
  const params = useParams<{ patientId: string; documentId: string }>();
  const documentId = params.documentId;

  const [doc, setDoc] = React.useState<PatientDocument | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!documentId) return;
      setLoading(true);
      try {
        const res = await api.get<PatientDocument>(`/patient-documents/${documentId}`);
        if (!cancelled) {
          setDoc(res.data ?? null);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Document introuvable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  const handlePrint = async () => {
    window.print();
    if (!doc) return;
    try {
      const res = await api.patch<PatientDocument>(`/patient-documents/${doc.id}/print`);
      if (res.data) setDoc({ ...doc, printed_at: res.data.printed_at ?? new Date().toISOString() });
    } catch {
      /* l'horodatage d'impression est indicatif : ne pas bloquer l'utilisateur */
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Chargement du document…</p>;
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Document introuvable"}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href={`/patients/carnet/${params.patientId}`}>Retour au carnet</Link>
        </Button>
      </div>
    );
  }

  const content = doc.content || {};
  const patient = content.patient || {};
  const order = content.order || {};
  const visit = content.visit || null;
  const laboratory = content.laboratory || {};
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  const totals = content.totals || {};
  const currency = totals.currency || "USD";

  return (
    <div className="space-y-4">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          html,
          body {
            background: #fff !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Button variant="outline" asChild>
          <Link href={`/patients/carnet/${params.patientId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour au carnet
          </Link>
        </Button>
        <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]" onClick={() => void handlePrint()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimer
        </Button>
      </div>

      <article className="print-sheet mx-auto w-full max-w-[210mm] rounded-xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{line(laboratory.name)}</p>
            {laboratory.address ? <p className="text-xs text-slate-600">{laboratory.address}</p> : null}
            <p className="text-xs text-slate-600">
              {[laboratory.phone, laboratory.email].filter(Boolean).join(" — ") || "—"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-base font-semibold text-slate-900">{doc.title || TYPE_LABELS[doc.document_type] || "Document"}</p>
            {doc.reference ? <p className="font-mono text-xs text-slate-600">{doc.reference}</p> : null}
            <p className="text-xs text-slate-600">Émis le {new Date(doc.created_at).toLocaleDateString("fr-FR")}</p>
            {doc.printed_at ? (
              <p className="text-[11px] text-slate-400">Imprimé le {new Date(doc.printed_at).toLocaleString("fr-FR")}</p>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Patient</p>
            <p className="text-sm font-medium text-slate-900">
              {line([patient.first_name, patient.last_name].filter(Boolean).join(" "))}
            </p>
            <p className="text-xs text-slate-600">Matricule : <span className="font-mono">{line(patient.matricule)}</span></p>
            <p className="text-xs text-slate-600">
              {patient.birth_date ? `Né(e) le ${new Date(patient.birth_date).toLocaleDateString("fr-FR")}` : "Date de naissance : —"}
              {patient.gender ? ` — ${patient.gender}` : ""}
            </p>
            <p className="text-xs text-slate-600">Téléphone : {line(patient.phone)}</p>
            {patient.address ? <p className="text-xs text-slate-600">Adresse : {patient.address}</p> : null}
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demande</p>
            <p className="font-mono text-sm text-slate-900">{line(order.matricule)}</p>
            <p className="text-xs text-slate-600">
              Date : {order.date ? new Date(order.date).toLocaleDateString("fr-FR") : "—"}
              {order.priority ? ` — priorité ${order.priority}` : ""}
            </p>
            {visit?.matricule ? <p className="text-xs text-slate-600">Visite : {visit.matricule}</p> : null}
            {content.practitioner ? <p className="text-xs text-slate-600">Praticien : {content.practitioner}</p> : null}
            {order.payment_status ? <p className="text-xs text-slate-600">Paiement : {order.payment_status}</p> : null}
          </div>
        </section>

        <section className="py-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Examens demandés</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2 font-medium">Code</th>
                <th className="py-2 pr-2 font-medium">Examen</th>
                <th className="py-2 pr-2 font-medium">Échantillon</th>
                <th className="py-2 pr-2 text-right font-medium">Qté</th>
                <th className="py-2 pr-2 text-right font-medium">P.U.</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-slate-500">Aucun examen sur ce document.</td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={`${item.test_catalog_id || item.code || "item"}-${index}`} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-mono text-xs">{line(item.code)}</td>
                    <td className="py-2 pr-2">
                      {line(item.name)}
                      {item.preparation ? <span className="block text-[11px] text-slate-500">Préparation : {item.preparation}</span> : null}
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-600">{line(item.sample_type || item.container)}</td>
                    <td className="py-2 pr-2 text-right text-xs">{line(item.quantity ?? 1)}</td>
                    <td className="py-2 pr-2 text-right text-xs">{money(item.unit_price, currency)}</td>
                    <td className="py-2 text-right text-xs">{money(item.total_price, currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <dl className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Sous-total</dt>
                <dd>{money(totals.subtotal, currency)}</dd>
              </div>
              {Number(totals.discount) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Remise</dt>
                  <dd>-{money(totals.discount, currency)}</dd>
                </div>
              ) : null}
              {Number(totals.tax) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Taxes</dt>
                  <dd>{money(totals.tax, currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{money(totals.total, currency)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {content.notes ? (
          <section className="border-t border-slate-200 py-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <p className="whitespace-pre-line text-xs text-slate-700">{content.notes}</p>
          </section>
        ) : null}

        {content.reason ? (
          <section className="border-t border-slate-200 py-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Motif</p>
            <p className="text-xs text-slate-700">{content.reason}</p>
          </section>
        ) : null}

        <footer className="mt-6 flex flex-col gap-6 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
          <div className="text-[11px] text-slate-500">
            <p>Document généré par Alliya Laboratoire.</p>
            <p>À présenter au laboratoire lors du prélèvement.</p>
          </div>
          <div className="text-center text-[11px] text-slate-500">
            <p className="mb-10">Signature et cachet</p>
            <div className="mx-auto w-40 border-t border-dashed border-slate-300" />
          </div>
        </footer>
      </article>
    </div>
  );
}