"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { useConfigurationOptions } from "@/lib/use-lab-options";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Printer } from "lucide-react";

function line(value: any) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function money(amount: any, currency: string) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "USD" }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  issued: "Émise",
  sent: "Envoyée",
  partially_paid: "Partiellement payée",
  paid: "Payée",
  cancelled: "Annulée",
  overdue: "En retard",
};

export default function InvoicePrintPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;
  const { user } = useAuth();
  const { items: configItems } = useConfigurationOptions(user?.laboratory_id);

  const [invoice, setInvoice] = React.useState<any | null>(null);
  const [laboratory, setLaboratory] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!invoiceId) return;
      setLoading(true);
      try {
        const res = await api.get<any>(`/billing/${invoiceId}`);
        if (cancelled) return;
        setInvoice(res.data ?? null);
        if (user?.laboratory_id) {
          const lab = await api.get<any>(`/laboratories/${user.laboratory_id}`);
          if (!cancelled) setLaboratory(lab.data ?? null);
        }
        setError(null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Facture introuvable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [invoiceId, user?.laboratory_id]);

  const feeTypeLabels = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of (configItems.fee_type ?? []) as any[]) {
      map[String(item.code)] = String(item.label || item.code);
    }
    return map;
  }, [configItems]);

  const feeTypeLabel = (code: string | null | undefined) =>
    (code && feeTypeLabels[code]) || (code ? code.replace(/_/g, " ") : "—");

  if (loading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Chargement de la facture…</p>;
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Facture introuvable"}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/facturation">Retour à la facturation</Link>
        </Button>
      </div>
    );
  }

  const currency = invoice.currency || "USD";
  const items: any[] = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
  const payments: any[] = Array.isArray(invoice.payments) ? invoice.payments : [];
  const patient = invoice.patient || {};
  const amountPaid = Number(invoice.amount_paid ?? payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0));
  const balance = Number(invoice.balance ?? Math.max(Number(invoice.total ?? 0) - amountPaid, 0));

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
          <Link href="/facturation">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la facturation
          </Link>
        </Button>
        <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimer
        </Button>
      </div>

      <article className="print-sheet mx-auto w-full max-w-[210mm] rounded-xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{line(laboratory?.name || "Alliya Laboratoire")}</p>
            {laboratory?.address ? <p className="text-xs text-slate-600">{laboratory.address}</p> : null}
            <p className="text-xs text-slate-600">
              {[laboratory?.phone, laboratory?.email].filter(Boolean).join(" — ") || "—"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-base font-semibold text-slate-900">Facture {line(invoice.invoice_number)}</p>
            <p className="text-xs text-slate-600">Émise le {invoice.issued_date ? new Date(invoice.issued_date).toLocaleDateString("fr-FR") : "—"}</p>
            {invoice.due_date ? (
              <p className="text-xs text-slate-600">Échéance : {new Date(invoice.due_date).toLocaleDateString("fr-FR")}</p>
            ) : null}
            <p className="text-xs font-medium text-slate-700">Statut : {STATUS_LABEL[invoice.status] || line(invoice.status)}</p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Patient</p>
            <p className="text-sm font-medium text-slate-900">
              {line([patient.first_name, patient.last_name].filter(Boolean).join(" "))}
            </p>
            <p className="text-xs text-slate-600">Matricule : <span className="font-mono">{line(patient.matricule)}</span></p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Règlement</p>
            <p className="text-xs text-slate-600">Mode de règlement : voir reçu ci-dessous</p>
            <p className="text-xs text-slate-600">Devise : {currency}</p>
          </div>
        </section>

        <section className="py-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Détail des prestations</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2 font-medium">Prestation</th>
                <th className="py-2 pr-2 font-medium">Type de frais</th>
                <th className="py-2 pr-2 text-right font-medium">Qté</th>
                <th className="py-2 pr-2 text-right font-medium">P.U.</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-xs text-slate-500">Aucune ligne sur cette facture.</td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{line(item.description)}</td>
                    <td className="py-2 pr-2 text-xs text-slate-600">{feeTypeLabel(item.fee_type)}</td>
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
                <dd>{money(invoice.subtotal, currency)}</dd>
              </div>
              {Number(invoice.discount) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Remise</dt>
                  <dd>-{money(invoice.discount, currency)}</dd>
                </div>
              ) : null}
              {Number(invoice.tax) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Taxes</dt>
                  <dd>{money(invoice.tax, currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{money(invoice.total, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Payé</dt>
                <dd>{money(amountPaid, currency)}</dd>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <dt>Solde</dt>
                <dd>{money(balance, currency)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {payments.length > 0 && (
          <section className="border-t border-slate-200 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paiements enregistrés</p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="py-1 pr-2 font-medium">Date</th>
                  <th className="py-1 pr-2 font-medium">Mode</th>
                  <th className="py-1 pr-2 font-medium">Référence</th>
                  <th className="py-1 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-1 pr-2">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="py-1 pr-2">{(p.method || "—").replace(/_/g, " ")}</td>
                    <td className="py-1 pr-2">{line(p.reference)}</td>
                    <td className="py-1 text-right">{money(p.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {invoice.notes ? (
          <section className="border-t border-slate-200 py-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <p className="whitespace-pre-line text-xs text-slate-700">{invoice.notes}</p>
          </section>
        ) : null}

        <footer className="mt-6 flex flex-col gap-6 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
          <div className="text-[11px] text-slate-500">
            <p>Document généré par Alliya Laboratoire.</p>
            <p>Merci de conserver ce justificatif.</p>
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