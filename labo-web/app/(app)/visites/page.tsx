"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const PAGE_SIZE = 10;

export default function VisitesPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const visitsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any[]>(`/visits?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = visitsResult.loading;
  const error = visitsResult.error;
  const envelope = visitsResult.data as any;
  const visits: any[] = (envelope?.data || []).filter((v: any) =>
    `${v.patient?.first_name || ""} ${v.patient?.last_name || ""} ${v.matricule || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [search, statusFilter, envelope]);
  const shown = visits.slice(0, visible);
  const hasMore = visible < visits.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current; if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, visits.length)); }, { rootMargin: "200px" });
    obs.observe(el); return () => obs.disconnect();
  }, [hasMore, visits.length]);

  if (error) {
    return <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{error.message || "Impossible de charger les visites"}</AlertDescription></Alert>;
  }

  const stats = [
    { label: "Total", value: visits.length, cls: "text-[#1E2A47]" },
    { label: "Planifiées", value: visits.filter((v) => v.status === "scheduled").length, cls: "text-[#2E7A7C]" },
    { label: "Terminées", value: visits.filter((v) => v.status === "completed").length, cls: "text-emerald-600" },
    { label: "En cours", value: visits.filter((v) => v.status === "in_progress").length, cls: "text-amber-600" },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader title="Visites" description="Gestion des visites et rendez-vous patients" />

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
        <Link href="/patients/nouveau"><Button className="!bg-[#3D9597] !text-white w-auto h-9 text-xs sm:text-sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle visite</Button></Link>
      </div>

      <div className="space-y-2 sm:hidden">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        : shown.length === 0 ? <div className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-lg">Aucune visite trouvée.</div>
        : shown.map((v) => (
          <Card key={v.id} className="border border-[#E5E7EB]"><CardContent className="p-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1"><Calendar className="h-3.5 w-3.5 text-[#3D9597] shrink-0" /><span className="font-mono text-xs text-slate-700 truncate">{v.matricule}</span></div>
              <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" />{v.patient?.first_name} {v.patient?.last_name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{v.visit_date ? new Date(v.visit_date).toLocaleDateString("fr-FR") : "—"} · {v.reason || "—"}</p>
            </div>
            <Badge variant={v.status === "completed" ? "default" : v.status === "scheduled" ? "outline" : "secondary"} className="text-[10px] shrink-0">{v.status}</Badge>
          </CardContent></Card>
        ))}
        {hasMore && <div ref={sentinelRef} className="h-6 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>

      <div className="hidden sm:block rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Matricule</TableHead><TableHead>Patient</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Motif</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
            : shown.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Aucune visite trouvée.</TableCell></TableRow>
            : shown.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.matricule}</TableCell>
                <TableCell><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{v.patient?.first_name} {v.patient?.last_name}</span></div></TableCell>
                <TableCell>{v.visit_date ? new Date(v.visit_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                <TableCell><Badge variant={v.status === "completed" ? "default" : v.status === "scheduled" ? "outline" : "secondary"}>{v.status}</Badge></TableCell>
                <TableCell>{v.reason || "—"}</TableCell>
                <TableCell className="text-right"><Link href="/patients/dossiers"><Button variant="ghost" size="sm">Dossier</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasMore && <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
      </div>
    </div>
  );
}
