"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SpecimenFormDialog } from "@/components/forms/specimen-form-dialog";
import Link from "next/link";

const PAGE_SIZE = 10;

/** Statuts §7.4 côté backend (les alias anglais restent acceptés). */
const RECEIVED_STATUSES = ["recu", "accepte", "received", "accepted"];
const IN_PROGRESS_STATUSES = ["en_attente", "en_cours", "pending", "processing"];
const DONE_STATUSES = ["epuise", "completed", "eplore"];

export default function PrelevementsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const specimensResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any[]>(`/specimens?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id, deps: [search, statusFilter] });

  const loading = specimensResult.loading;
  const error = specimensResult.error;
  const envelope = specimensResult.data as any;
  const specimens: any[] = (envelope?.data || []).filter((s: any) =>
    `${s.patient?.first_name || ""} ${s.patient?.last_name || ""} ${s.matricule || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [search, statusFilter, envelope]);
  const shown = specimens.slice(0, visible);
  const hasMore = visible < specimens.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current; if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, specimens.length)); }, { rootMargin: "200px" });
    obs.observe(el); return () => obs.disconnect();
  }, [hasMore, specimens.length]);

  if (error) {
    return <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{error.message || "Impossible de charger les prélèvements"}</AlertDescription></Alert>;
  }

  const stats = [
    { label: "Total", value: specimens.length, cls: "text-[#1E2A47]" },
    { label: "Reçus", value: specimens.filter((s) => RECEIVED_STATUSES.includes(s.status)).length, cls: "text-[#2E7A7C]" },
    { label: "En cours", value: specimens.filter((s) => IN_PROGRESS_STATUSES.includes(s.status)).length, cls: "text-amber-600" },
    { label: "Terminés", value: specimens.filter((s) => DONE_STATUSES.includes(s.status)).length, cls: "text-[#2E7A7C]" },
  ];

  const patientOf = (s: any) =>
    `${s.patient?.first_name ?? ""} ${s.patient?.last_name ?? ""}`.trim() || "—";

  const detailFields = (s: any) => [
    { label: "Patient", value: patientOf(s) },
    { label: "Matricule", value: s.matricule, mono: true },
    { label: "Type", value: s.type || "—" },
    { label: "Statut", value: <StatusBadge status={s.status} /> },
    { label: "Date de collecte", value: s.collection_date ? new Date(s.collection_date).toLocaleString("fr-FR") : "—" },
    { label: "Réception", value: s.received_at ? new Date(s.received_at).toLocaleString("fr-FR") : "—" },
    { label: "Accepté le", value: s.accepted_at ? new Date(s.accepted_at).toLocaleString("fr-FR") : "—" },
    { label: "Motif de rejet", value: s.rejection_reason || s.reject_reason },
    { label: "Section", value: s.section || "—" },
    { label: "Emplacement", value: s.storage_location || "—" },
    { label: "Jeton QR", value: s.qr_token, mono: true },
    { label: "Notes", value: s.notes, wide: true },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader title="Prélèvements" description="Gestion des échantillons biologiques" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-[#E5E7EB]"><CardContent className="p-3 sm:p-4"><p className="text-[11px] sm:text-sm text-slate-500">{s.label}</p><p className={`text-lg sm:text-2xl font-bold ${s.cls}`}>{loading ? "…" : s.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <div><Label htmlFor="search" className="text-xs sm:text-sm">Rechercher</Label><Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, matricule…" className="h-9 sm:h-10 text-sm sm:w-56" disabled={loading} /></div>
          <div><Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label><Input id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="Tous" className="h-9 sm:h-10 text-sm sm:w-40" disabled={loading} /></div>
        </div>
        <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-auto h-9 text-xs sm:h-10 sm:text-sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Nouveau prélèvement
        </Button>
      </div>

      <div className="space-y-2 sm:hidden">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        : shown.length === 0 ? <div className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-lg">Aucun prélèvement trouvé.</div>
        : shown.map((s) => (
          <Card
            key={s.id}
            onClick={() => setSelected(s)}
            className="border border-[#E5E7EB] hover:border-[#3D9597]/50"
          >
            <CardContent className="p-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1"><FlaskConical className="h-3.5 w-3.5 text-[#3D9597] shrink-0" /><span className="font-mono text-xs text-slate-700 truncate">{s.matricule}</span></div>
              <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" />{patientOf(s)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.type || "—"} · {s.collection_date ? new Date(s.collection_date).toLocaleDateString("fr-FR") : "—"}</p>
            </div>
            <StatusBadge status={s.status} className="text-[10px] shrink-0" />
          </CardContent></Card>
        ))}
        {hasMore && <div ref={sentinelRef} className="h-6 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <div className="hidden sm:block rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Matricule</TableHead><TableHead>Patient</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead>Date collecte</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
            : shown.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Aucun prélèvement trouvé.</TableCell></TableRow>
            : shown.map((s) => (
              <TableRow
                key={s.id}
                onClick={() => setSelected(s)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(s); } }}
                className="cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
              >
                <TableCell className="font-mono text-xs">{s.matricule}</TableCell>
                <TableCell><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{patientOf(s)}</span></div></TableCell>
                <TableCell>{s.type || "—"}</TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
                <TableCell>{s.collection_date ? new Date(s.collection_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                <TableCell className="text-right"><Link href="/patients/dossiers"><Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>Dossier</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasMore && <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.matricule || "Prélèvement"}
        subtitle={selected ? patientOf(selected) : undefined}
        badge={selected?.status ? <StatusBadge status={selected.status} /> : undefined}
        fields={selected ? detailFields(selected) : []}
      />

      <SpecimenFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void specimensResult.refetch(); }}
      />
    </div>
  );
}
