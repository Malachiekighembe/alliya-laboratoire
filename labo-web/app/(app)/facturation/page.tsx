"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { useLabPatients } from "@/lib/use-lab-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Receipt, User } from "lucide-react";
import { InvoiceFormDialog } from "@/components/forms/invoice-form-dialog";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  issued: "Émise",
  sent: "Envoyée",
  partially_paid: "Partiellement payée",
  paid: "Payée",
  cancelled: "Annulée",
  overdue: "En retard",
};

export default function FacturationPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();
  const { patients } = useLabPatients(user?.laboratory_id);
  const [search, setSearch] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const invoicesResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    return api.safeGet<any>(`/billing?laboratory_id=${user.laboratory_id}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = invoicesResult.loading;
  const error = invoicesResult.error;
  const envelope = invoicesResult.data as any;
  const invoices: any[] = Array.isArray(envelope?.data) ? envelope.data : [];

  const nameOf = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient" : "—";
  };

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${inv.invoice_number || ""} ${nameOf(inv.patient_id)}`.toLowerCase().includes(q);
  });

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [invoices.length, search]);

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, filtered.length]);

  const currencyOf = (inv: any) => inv.currency || "USD";
  const sum = (status: string[]) => invoices.filter((i) => status.includes(i.status)).reduce((acc, i) => acc + Number(i.total || 0), 0);
  const collected = sum(["paid"]);
  const outstanding = sum(["issued", "sent", "partially_paid", "overdue"]);

  const stats = [
    { label: "Factures", value: invoices.length, cls: "text-[#1E2A47]" },
    { label: "Encaissé", value: collected.toLocaleString("fr-FR"), cls: "text-[#2E7A7C]" },
    { label: "En attente", value: outstanding.toLocaleString("fr-FR"), cls: "text-amber-600" },
    { label: "Brouillons", value: invoices.filter((i) => i.status === "draft").length, cls: "text-slate-600" },
  ];

  const detailFields = (inv: any) => [
    { label: "Patient", value: nameOf(inv.patient_id) },
    { label: "N° facture", value: inv.invoice_number, mono: true },
    { label: "Statut", value: STATUS_LABEL[inv.status] || inv.status },
    { label: "Émise le", value: inv.issued_date ? new Date(inv.issued_date).toLocaleDateString("fr-FR") : "—" },
    { label: "Échéance", value: inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—" },
    { label: "Sous-total", value: `${Number(inv.subtotal ?? 0).toLocaleString("fr-FR")} ${currencyOf(inv)}` },
    { label: "Remise", value: inv.discount ? `${Number(inv.discount).toLocaleString("fr-FR")} ${currencyOf(inv)}` : "—" },
    { label: "Taxes", value: inv.tax ? `${Number(inv.tax).toLocaleString("fr-FR")} ${currencyOf(inv)}` : "—" },
    { label: "Total", value: `${Number(inv.total || 0).toLocaleString("fr-FR")} ${currencyOf(inv)}` },
    { label: "Payé", value: `${Number(inv.amount_paid || 0).toLocaleString("fr-FR")} ${currencyOf(inv)}` },
    { label: "Solde", value: `${Number(inv.balance ?? Math.max(Number(inv.total || 0) - Number(inv.amount_paid || 0), 0)).toLocaleString("fr-FR")} ${currencyOf(inv)}` },
    { label: "Notes", value: inv.notes, wide: true },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Facturation"
        description="Factures, encaissements et suivi de caisse"
        action={hasPermission("billing.create") ? (
          <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Receipt className="h-4 w-4 mr-2" /> Nouvelle facture
          </Button>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-[#E5E7EB] shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm text-slate-500">{s.label}</p>
              <p className={`text-base sm:text-xl font-semibold ${s.cls}`}>{loading ? "…" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error.message || "Impossible de charger les factures"}</p>
            <Button size="sm" variant="outline" onClick={() => { void invoicesResult.refetch(); }}>Réessayer</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="sm:max-w-xs">
              <Label htmlFor="inv_search" className="text-xs sm:text-sm">Rechercher</Label>
              <Input id="inv_search" className="h-9 sm:h-10 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° facture, patient…" disabled={loading} />
            </div>

            <div className="space-y-2 sm:hidden">
              {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
                : shown.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Aucune facture.</p>
                : shown.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelected(inv)}
                    className="w-full text-left rounded-lg border border-[#EEF2F6] bg-white p-3 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">{inv.invoice_number || "—"}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{STATUS_LABEL[inv.status] || inv.status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <User className="h-3 w-3" />{nameOf(inv.patient_id)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {inv.issued_date ? new Date(inv.issued_date).toLocaleDateString("fr-FR") : "—"}
                      {inv.due_date ? ` · échéance ${new Date(inv.due_date).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#1E2A47]">{Number(inv.total || 0).toLocaleString("fr-FR")} {currencyOf(inv)}</p>
                  </button>
                ))}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Émise le</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  )) : shown.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Aucune facture.</TableCell></TableRow>
                  ) : shown.map((inv) => (
                    <TableRow
                      key={inv.id}
                      onClick={() => setSelected(inv)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(inv); } }}
                      className="cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                    >
                      <TableCell className="font-mono text-xs">{inv.invoice_number || "—"}</TableCell>
                      <TableCell>{nameOf(inv.patient_id)}</TableCell>
                      <TableCell>{inv.issued_date ? new Date(inv.issued_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell><Badge variant="outline">{STATUS_LABEL[inv.status] || inv.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{Number(inv.total || 0).toLocaleString("fr-FR")} {currencyOf(inv)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {hasMore && <div ref={sentinelRef} className="h-6 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
          </CardContent>
        </Card>
      )}

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.invoice_number || "Facture"}
        subtitle={selected ? nameOf(selected.patient_id) : undefined}
        badge={selected ? <Badge variant="outline">{STATUS_LABEL[selected.status] || selected.status}</Badge> : undefined}
        fields={selected ? detailFields(selected) : []}
      />

      <InvoiceFormDialog
        open={open}
        onOpenChange={setOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void invoicesResult.refetch(); }}
      />
    </div>
  );
}