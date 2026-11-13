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
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarPlus, User, Calendar } from "lucide-react";
import { AppointmentFormDialog } from "@/components/forms/appointment-form-dialog";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  honore: "Honoré",
  annule: "Annulé",
  absent: "Absent",
};

export default function RendezVousPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const appointmentsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
    });
    return api.safeGet<any>(`/appointments?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id, deps: [search] });

  const loading = appointmentsResult.loading;
  const error = appointmentsResult.error;
  const envelope = appointmentsResult.data as any;
  const payload = Array.isArray(envelope?.data) ? envelope.data : (envelope?.data?.items ?? []);
  const appointments: any[] = Array.isArray(payload) ? payload : [];

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [appointments.length]);

  const shown = appointments.slice(0, visible);
  const hasMore = visible < appointments.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, appointments.length));
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, appointments.length]);

  const patientOf = (v: any) =>
    v.patient_name ||
    `${v.patient?.first_name ?? ""} ${v.patient?.last_name ?? ""}`.trim() ||
    "—";

  const dateOf = (v: any) => {
    const raw = v.appointment_date || v.visit_date;
    return raw ? new Date(raw) : null;
  };

  const stats = [
    { label: "Total", value: appointments.length, cls: "text-[#1E2A47]" },
    { label: "Planifiés", value: appointments.filter((v) => v.status === "planifie").length, cls: "text-[#2E7A7C]" },
    { label: "Honorés", value: appointments.filter((v) => v.status === "honore").length, cls: "text-[#2E7A7C]" },
    { label: "Annulés", value: appointments.filter((v) => v.status === "annule").length, cls: "text-amber-600" },
  ];

  const detailFields = (v: any) => [
    { label: "Patient", value: patientOf(v) },
    { label: "Matricule", value: v.matricule || v.patient?.matricule, mono: true },
    { label: "Statut", value: <StatusBadge status={v.status} /> },
    { label: "Date", value: dateOf(v) ? dateOf(v)!.toLocaleString("fr-FR") : "—" },
    { label: "Motif", value: v.reason || "—" },
    { label: "Notes", value: v.notes, wide: true },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Rendez-vous"
        description="Planification et suivi des passages patients"
        action={hasPermission("visits.create") ? (
          <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto" onClick={() => setOpen(true)}>
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
            <Button size="sm" variant="outline" onClick={() => { void appointmentsResult.refetch(); }}>Réessayer</Button>
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
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelected(v)}
                    className="w-full text-left rounded-lg border border-[#EEF2F6] bg-white p-3 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-900">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{patientOf(v)}</span>
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{STATUS_LABEL[v.status] || v.status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="h-3 w-3" />{dateOf(v) ? dateOf(v)!.toLocaleDateString("fr-FR") : "—"}{v.reason ? ` · ${v.reason}` : ""}
                    </p>
                  </button>
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
                    <TableRow
                      key={v.id}
                      onClick={() => setSelected(v)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(v); } }}
                      className="cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                    >
                      <TableCell>{patientOf(v)}</TableCell>
                      <TableCell>{dateOf(v) ? dateOf(v)!.toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
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

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.matricule || "Rendez-vous"}
        subtitle={selected ? patientOf(selected) : undefined}
        badge={selected?.status ? <StatusBadge status={selected.status} /> : undefined}
        fields={selected ? detailFields(selected) : []}
      />

      <AppointmentFormDialog
        open={open}
        onOpenChange={setOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void appointmentsResult.refetch(); }}
      />
    </div>
  );
}