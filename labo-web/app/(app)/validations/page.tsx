"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api, toList } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const PAGE_SIZE = 10;

/** Statuts §11.1 côté backend (les alias anglais restent acceptés). */
const VALIDATED_STATUSES = ["valide", "validated", "amended"];
const PENDING_STATUSES = ["en_attente", "en_verification", "pending", "submitted"];
const REJECTED_STATUSES = ["rejete", "rejected", "a_corriger", "annule"];

export default function ValidationsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [selected, setSelected] = React.useState<any | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const validationsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any>(`/result-validations?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id, deps: [search, statusFilter] });

  const loading = validationsResult.loading;
  const error = validationsResult.error;
  const envelope = validationsResult.data as any;
  const validations: any[] = toList<any>(envelope).filter((v: any) => {
    const patient = v.result?.patient || {};
    return `${patient.first_name || ""} ${patient.last_name || ""} ${v.result?.matricule || ""}`.toLowerCase().includes(search.toLowerCase());
  });

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [search, statusFilter, envelope]);
  const shown = validations.slice(0, visible);
  const hasMore = visible < validations.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current; if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, validations.length)); }, { rootMargin: "200px" });
    obs.observe(el); return () => obs.disconnect();
  }, [hasMore, validations.length]);

  const stats = [
    { label: "Total", value: validations.length, cls: "text-[#1E2A47]" },
    { label: "Validées", value: validations.filter((v) => VALIDATED_STATUSES.includes(v.status)).length, cls: "text-[#2E7A7C]" },
    { label: "En attente", value: validations.filter((v) => PENDING_STATUSES.includes(v.status)).length, cls: "text-amber-600" },
    { label: "Rejetées", value: validations.filter((v) => REJECTED_STATUSES.includes(v.status)).length, cls: "text-red-600" },
  ];

  const patientOf = (v: any) => {
    const p = v.result?.patient || {};
    return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—";
  };

  const detailFields = (v: any) => {
    const result = v.result || {};
    return [
      { label: "Résultat", value: result.matricule, mono: true },
      { label: "Patient", value: patientOf(v) },
      { label: "Analyse", value: result.test_catalog?.name || result.test_name || "—" },
      { label: "Valeur", value: result.value ?? "—" },
      { label: "Unité", value: result.unit || "—" },
      { label: "Statut", value: <StatusBadge status={v.status} /> },
      { label: "Demandé par", value: v.requested_by ? `${v.requested_by.first_name ?? ""} ${v.requested_by.last_name ?? ""}`.trim() || "—" : "—" },
      { label: "Traité par", value: v.reviewed_by ? `${v.reviewed_by.first_name ?? ""} ${v.reviewed_by.last_name ?? ""}`.trim() || "—" : "—" },
      { label: "Décision", value: v.decision || "—" },
      { label: "Date", value: v.created_at ? new Date(v.created_at).toLocaleString("fr-FR") : "—" },
      { label: "Commentaire", value: v.comments || v.comment, wide: true },
    ];
  };

  const errorView = error ? (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader title="Validations" description="Validation et vérification des résultats d'analyses" />
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message || "Impossible de charger les validations"}</p>
          <Button size="sm" variant="outline" onClick={() => { void validationsResult.refetch(); }}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  ) : null;

  if (errorView) return errorView;

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader title="Validations" description="Validation et vérification des résultats d'analyses" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-[#E5E7EB]"><CardContent className="p-3 sm:p-4"><p className="text-[11px] sm:text-sm text-slate-500">{s.label}</p><p className={`text-lg sm:text-2xl font-bold ${s.cls}`}>{loading ? "…" : s.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <div><Label htmlFor="search" className="text-xs sm:text-sm">Rechercher</Label><Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, résultat…" className="h-9 sm:h-10 text-sm sm:w-56" disabled={loading} /></div>
          <div><Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label><Input id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="Tous" className="h-9 sm:h-10 text-sm sm:w-40" disabled={loading} /></div>
        </div>
      </div>

      <div className="space-y-2 sm:hidden">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        : shown.length === 0 ? <div className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-lg">Aucune validation trouvée.</div>
        : shown.map((v) => {
          const result = v.result || {};
          return (
            <Card
              key={v.id}
              onClick={() => setSelected(v)}
              className="border border-[#E5E7EB] hover:border-[#3D9597]/50"
            >
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1"><ClipboardCheck className="h-3.5 w-3.5 text-[#3D9597] shrink-0" /><span className="font-mono text-xs text-slate-700 truncate">{result.matricule || "—"}</span></div>
                  <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" />{patientOf(v)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{result.test_catalog?.name || "—"} · {result.value || "—"}</p>
                </div>
                <StatusBadge status={v.status} className="text-[10px] shrink-0" />
              </CardContent>
            </Card>
          );
        })}
        {hasMore && <div ref={sentinelRef} className="h-6 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <div className="hidden sm:block rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Résultat</TableHead><TableHead>Patient</TableHead><TableHead>Test</TableHead><TableHead>Valeur</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
            : shown.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Aucune validation trouvée.</TableCell></TableRow>
            : shown.map((v) => {
              const result = v.result || {};
              return (
                <TableRow
                  key={v.id}
                  onClick={() => setSelected(v)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(v); } }}
                  className="cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                >
                  <TableCell className="font-mono text-xs">{result.matricule || "—"}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{patientOf(v)}</span></div></TableCell>
                  <TableCell>{result.test_catalog?.name || "—"}</TableCell>
                  <TableCell>{result.value || "—"}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell className="text-right"><Link href="/patients/dossiers" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="sm">Dossier</Button></Link></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {hasMore && <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.result?.matricule || "Validation"}
        subtitle={selected ? patientOf(selected) : undefined}
        badge={selected?.status ? <StatusBadge status={selected.status} /> : undefined}
        fields={selected ? detailFields(selected) : []}
      />
    </div>
  );
}