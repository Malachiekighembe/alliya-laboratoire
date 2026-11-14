"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api, toList, formatDate, formatDateTime } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResultFormDialog } from "@/components/forms/result-form-dialog";
import { ResultReviewDialog } from "@/components/forms/result-review-dialog";
import { FlaskConical, Plus } from "lucide-react";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "a_corriger", label: "À corriger" },
  { value: "en_verification", label: "En vérification" },
  { value: "valide", label: "Validé" },
  { value: "rejete", label: "Rejeté" },
  { value: "annule", label: "Annulé" },
];

export default function ResultatsPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<any | null>(null);
  const [reviewTarget, setReviewTarget] = React.useState<any | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState("");
  const [optimisticRows, setOptimisticRows] = React.useState<any[]>([]);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const canCreate = hasPermission("results.create");
  const canUpdate = hasPermission("results.update");
  const canValidate = hasPermission("results.validate");

  const resultsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    return api.safeGet<any>(`/results?laboratory_id=${user.laboratory_id}&page=1&limit=100`);
  }, { enabled: !!user?.laboratory_id });

  const loading = resultsResult.loading;
  const error = resultsResult.error;
  const payload = resultsResult.data as any;
  const results: any[] = React.useMemo(() => {
    const base = toList<any>(payload);
    if (!optimisticRows.length) return base;
    const ids = new Set(base.map((b) => b.id));
    return [...optimisticRows.filter((row) => !ids.has(row.id)), ...base];
  }, [payload, optimisticRows]);

  const patientName = (r: any) =>
    r.patient_name ||
    [r.specimen?.patient?.first_name, r.specimen?.patient?.last_name].filter(Boolean).join(" ") ||
    [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(" ") ||
    "—";

  const testName = (r: any) => r.test_name || r.test_catalog?.name || "Analyse";

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${patientName(r)} ${testName(r)} ${r.matricule || ""}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, search, statusFilter]);

  React.useEffect(() => { setVisible(PAGE_SIZE); }, [search, statusFilter]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

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

  const runAction = async (result: any, action: "submit" | "validate") => {
    setActionError("");
    setBusyId(result.id);
    const nextStatus = action === "validate" ? "valide" : "en_verification";
    setOptimisticRows((prev) => prev.map((r) => (r.id === result.id ? { ...r, status: nextStatus } : r)));
    try {
      await api.patch(`/results/${result.id}/${action}`, action === "validate" ? {} : undefined);
      await resultsResult.refetch();
      if (selected?.id === result.id) {
        setSelected({ ...result, status: nextStatus });
      }
    } catch (err: any) {
      setOptimisticRows((prev) => prev.filter((r) => r.id !== result.id));
      setActionError(err?.message || "Action impossible");
    } finally {
      setBusyId(null);
    }
  };

  const valueOf = (r: any) =>
    r.result_type === "qualitative"
      ? r.qualitative_value || "—"
      : [r.value, r.unit].filter(Boolean).join(" ") || "—";

  const stats = [
    { label: "Résultats", value: results.length, cls: "text-[#1E2A47]" },
    { label: "En vérification", value: results.filter((r) => r.status === "en_verification").length, cls: "text-info" },
    { label: "Validés", value: results.filter((r) => r.status === "valide").length, cls: "text-success" },
    { label: "À corriger", value: results.filter((r) => r.status === "a_corriger").length, cls: "text-warning" },
  ];

  const detailFields = (r: any) => [
    { label: "Patient", value: patientName(r) },
    { label: "Matricule résultat", value: r.matricule, mono: true },
    { label: "Examen", value: testName(r) },
    { label: "Résultat", value: valueOf(r) },
    { label: "Valeurs de référence", value: r.reference_range || r.test_catalog?.reference_range || "—" },
    { label: "Méthode", value: r.method || r.test_catalog?.method || "—" },
    { label: "Statut", value: <StatusBadge status={r.status} /> },
    { label: "Date de résultat", value: r.result_date ? formatDate(r.result_date) : formatDateTime(r.created_at) },
    {
      label: "Saisi par",
      value: r.performed_by ? `${r.performed_by.first_name} ${r.performed_by.last_name ?? ""}`.trim() : "—",
    },
    {
      label: "Validé par",
      value: r.validated_by ? `${r.validated_by.first_name} ${r.validated_by.last_name ?? ""}`.trim() : "—",
    },
    { label: "Validé le", value: r.validated_at ? formatDateTime(r.validated_at) : "—" },
    { label: "Observations", value: r.observations || r.comments || "—", wide: true },
  ];

  const showActions = (r: any) => {
    const editable = r.status === "brouillon" || r.status === "a_corriger";
    return (
      <div className="flex flex-wrap gap-2">
        {canUpdate && editable && (
          <>
            <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setEditTarget(r)}>
              Modifier
            </Button>
            <Button
              size="sm"
              className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]"
              disabled={busyId === r.id}
              onClick={() => void runAction(r, "submit")}
            >
              Soumettre
            </Button>
          </>
        )}
        {canValidate && r.status !== "valide" && r.status !== "annule" && r.status !== "rejete" && (
          <Button size="sm" className="!bg-[#2E7A7C] !text-white hover:!bg-[#256769]" disabled={busyId === r.id} onClick={() => void runAction(r, "validate")}>
            Valider
          </Button>
        )}
        {canValidate && r.status === "en_verification" && (
          <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setReviewTarget(r)}>
            Demander une correction
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Résultats"
        description="Saisie, vérification et validation biologique des résultats"
        action={canCreate ? (
          <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Saisir un résultat
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

      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Action impossible</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error.message || "Impossible de charger les résultats"}</p>
            <Button size="sm" variant="outline" onClick={() => { void resultsResult.refetch(); }}>Réessayer</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div>
                <Label htmlFor="res_search" className="text-xs sm:text-sm">Rechercher</Label>
                <Input
                  id="res_search"
                  className="h-9 sm:h-10 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient, examen, matricule…"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="res_status" className="text-xs sm:text-sm">Statut</Label>
                <select
                  id="res_status"
                  className="flex h-9 sm:h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FlaskConical className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Aucun résultat pour ces critères.</p>
                {canCreate && (
                  <Link href="/prelevements" className="text-xs text-[#2E7A7C] underline">
                    Consulter les prélèvements disponibles
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Examen</th>
                        <th className="p-3">Résultat</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelected(r)}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r); } }}
                          className="border-b border-border hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                        >
                          <td className="p-3">{patientName(r)}</td>
                          <td className="p-3">{testName(r)}</td>
                          <td className="p-3 font-medium">{valueOf(r)}</td>
                          <td className="p-3"><StatusBadge status={r.status} /></td>
                          <td className="p-3 text-xs text-slate-500">{formatDate(r.result_date || r.created_at)}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {canUpdate && (r.status === "brouillon" || r.status === "a_corriger") ? (
                              <Button size="sm" variant="outline" onClick={() => setEditTarget(r)} disabled={busyId === r.id}>
                                Modifier
                              </Button>
                            ) : canValidate && r.status === "en_verification" ? (
                              <Button
                                size="sm"
                                className="!bg-[#2E7A7C] !text-white hover:!bg-[#256769]"
                                onClick={() => void runAction(r, "validate")}
                                disabled={busyId === r.id}
                              >
                                Valider
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden grid grid-cols-2 gap-2">
                  {shown.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className="text-left rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                    >
                      <p className="text-xs font-semibold text-slate-900 truncate">{testName(r)}</p>
                      <p className="text-[11px] text-slate-500 truncate">{patientName(r)}</p>
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[11px] font-medium text-slate-800 truncate">{valueOf(r)}</span>
                        <StatusBadge status={r.status} className="shrink-0 text-[10px]" />
                      </div>
                    </button>
                  ))}
                </div>
                {hasMore && <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected ? testName(selected) : "Résultat"}
        subtitle={selected ? patientName(selected) : undefined}
        badge={selected ? <StatusBadge status={selected.status} /> : undefined}
        fields={selected ? detailFields(selected) : []}
      >
        {selected && Array.isArray(selected.parameters) && selected.parameters.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Paramètres</p>
            <table className="mt-1 w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 text-left">Paramètre</th>
                  <th className="py-1 text-left">Valeur</th>
                  <th className="py-1 text-left">Unité</th>
                  <th className="py-1 text-left">Référence</th>
                  <th className="py-1 text-left">Drapeau</th>
                </tr>
              </thead>
              <tbody>
                {selected.parameters.map((p: any, idx: number) => (
                  <tr key={`${p.name}-${idx}`} className="border-t border-border">
                    <td className="py-1">{p.name}</td>
                    <td className="py-1 font-medium">{p.value ?? "—"}</td>
                    <td className="py-1">{p.unit || "—"}</td>
                    <td className="py-1">{p.reference_range || "—"}</td>
                    <td className="py-1">{p.flag || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selected && (
          <div className="mt-4 flex flex-wrap gap-2">
            {showActions(selected)}
          </div>
        )}
      </DetailDialog>

      <ResultFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        laboratoryId={user?.laboratory_id}
        onSaved={(created) => {
          if (created?.id) {
            setOptimisticRows((prev) => [{ ...created, _pending: true, status: created.status || "brouillon" }, ...prev]);
          }
          void resultsResult.refetch();
        }}
      />

      <ResultFormDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        laboratoryId={user?.laboratory_id}
        result={editTarget}
        onSaved={() => { void resultsResult.refetch(); }}
      />

      <ResultReviewDialog
        open={!!reviewTarget}
        onOpenChange={(open) => { if (!open) setReviewTarget(null); }}
        resultId={reviewTarget?.id ?? null}
        onDone={() => { void resultsResult.refetch(); }}
      />
    </div>
  );
}