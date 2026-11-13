"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarPlus, User, Calendar } from "lucide-react";
import { VisitFormDialog } from "@/components/forms/visit-form-dialog";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Planifiée",
  arrived: "Arrivée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "Absent",
};

export default function RendezVousPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [open, setOpen] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const visitsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
    });
    return api.safeGet<any>(`/visits?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id, deps: [search] });

  const loading = visitsResult.loading;
  const error = visitsResult.error;
  const envelope = visitsResult.data as any;
  const visits: any[] = Array.isArray(envelope?.data) ? envelope.data : [];

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [visits.length]);

  const shown = visits.slice(0, visible);
  const hasMore = visible < visits.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, visits.length));
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, visits.length]);

  const stats = [
    { label: "Total", value: visits.length, cls: "text-[#1E2A47]" },
    { label: "Planifiées", value: visits.filter((v) => v.status === "scheduled").length, cls: "text-[#2E7A7C]" },
    { label: "Terminées", value: visits.filter((v) => v.status === "completed").length, cls: "text-[#2E7A7C]" },
    { label: "Annulées", value: visits.filter((v) => v.status === "cancelled").length, cls: "text-amber-600" },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Rendez-vous"
        description="Planification et suivi des passages patients"
        action={hasPermission("visits.create") ? (
          <Button className="!bg-[#3D9597] !text-white w-full sm:w-auto" onClick={() => setOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" /> Nouveau rendez-vous
          </Button>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-[#E5E7EB] shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-sm text-slate-500">{s.label}</p>
              <p className={`text-lg sm:text-2xl font-semibold ${s.cls}`}>{loading ? "…" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error.message || "Impossible de charger les rendez-vous"}</p>
            <Button size="sm" variant="outline" onClick={() => { void visitsResult.refetch(); }}>Réessayer</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="sm:max-w-xs">
              <Label htmlFor="rdv_search" className="text-xs sm:text-sm">Rechercher</Label>
              <Input id="rdv_search" className="h-9 sm:h-10 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, matricule…" disabled={loading} />
            </div>

            <div className="space-y-2 sm:hidden">
              {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
                : shown.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Aucun rendez-vous.</p>
                : shown.map((v) => (
                  <div key={v.id} className="rounded-lg border border-[#EEF2F6] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-900">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{[v.patient?.first_name, v.patient?.last_name].filter(Boolean).join(" ") || "Patient"}</span>
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{STATUS_LABEL[v.status] || v.status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="h-3 w-3" />{v.visit_date ? new Date(v.visit_date).toLocaleDateString("fr-FR") : "—"}{v.reason ? ` · ${v.reason}` : ""}
                    </p>
                  </div>
                ))}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  )) : shown.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Aucun rendez-vous.</TableCell></TableRow>
                  ) : shown.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{[v.patient?.first_name, v.patient?.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell>{v.visit_date ? new Date(v.visit_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell><Badge variant="outline">{STATUS_LABEL[v.status] || v.status}</Badge></TableCell>
                      <TableCell>{v.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {hasMore && <div ref={sentinelRef} className="h-6 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
          </CardContent>
        </Card>
      )}

      <VisitFormDialog
        open={open}
        onOpenChange={setOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void visitsResult.refetch(); }}
      />
    </div>
  );
}