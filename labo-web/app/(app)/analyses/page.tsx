"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ResultFormDialog } from "@/components/forms/result-form-dialog";
import { SpecimenFormDialog } from "@/components/forms/specimen-form-dialog";

export default function AnalysesPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();
  const canEnterResult = hasPermission("results.create");
  const canCollect = hasPermission("specimens.create");
  const [analyses, setAnalyses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [resultTarget, setResultTarget] = React.useState<any | null>(null);
  const [specimenTarget, setSpecimenTarget] = React.useState<any | null>(null);
  const [optimisticRows, setOptimisticRows] = React.useState<any[]>([]);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    setLoading(true);
    const res = await api.safeGet<any>(`/analyses?laboratory_id=${user.laboratory_id}`);
    const payload: any = res.data;
    const list = Array.isArray(payload) ? payload : (payload?.items ?? payload?.data ?? []);
    setAnalyses(Array.isArray(list) ? list : []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    void load();
  }, [user, load]);

  React.useEffect(() => { setVisibleCount(10); }, [analyses.length]);
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => c + 10);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [analyses.length, visibleCount]);

  if (loading) return <div className="p-6 flex items-center justify-center text-slate-500">Chargement…</div>;
  if (optimisticRows.length) {
    const ids = new Set(analyses.map((a) => a.id));
    analyses.unshift(...optimisticRows.filter((row) => !ids.has(row.id)));
  }
  const visible = analyses.slice(0, visibleCount);

  const nameOf = (a: any) =>
    a.test_name || a.test_catalog?.name || a.order_item?.test_name || "Analyse";

  const patientOf = (a: any) =>
    a.patient_name ||
    [a.patient?.first_name, a.patient?.last_name].filter(Boolean).join(" ") ||
    "—";

  const detailFields = (a: any) => [
    { label: "Patient", value: patientOf(a) },
    { label: "Matricule", value: a.matricule, mono: true },
    { label: "Analyse", value: nameOf(a) },
    { label: "Section", value: a.section || a.test_catalog?.section || "—" },
    { label: "Statut", value: <StatusBadge status={a._pending ? "en_attente" : a.status} /> },
    { label: "Priorité", value: a.priority || "normale" },
    { label: "Demandé par", value: a.order?.matricule || "—" },
    { label: "Réalisé par", value: a.performed_by ? `${a.performed_by.first_name ?? ""} ${a.performed_by.last_name ?? ""}`.trim() || "—" : "—" },
    { label: "Date", value: a.created_at ? new Date(a.created_at).toLocaleString("fr-FR") : "—" },
    { label: "Notes", value: a.notes, wide: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analyses"
        description="File de travail du laboratoire et suivi des échantillons"
        action={
          <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/catalogue">
              <FlaskConical className="h-4 w-4 mr-2" /> Catalogue d'examens
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Analyses en cours</CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">Aucune analyse trouvée.</p>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Type d'analyse</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Priorité</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(a); } }}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                      >
                        <td className="p-3">{patientOf(a)}</td>
                        <td className="p-3">{nameOf(a)}</td>
                        <td className="p-3"><StatusBadge status={a._pending ? "en_attente" : a.status} /></td>
                        <td className="p-3">{a.priority || "normale"}</td>
                        <td className="p-3">{a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {canEnterResult && a.specimen_id ? (
                            <Button size="sm" variant="outline" onClick={() => setResultTarget(a)}>
                              Saisir
                            </Button>
                          ) : canCollect ? (
                            <Button size="sm" variant="outline" onClick={() => setSpecimenTarget(a)}>
                              Prélever
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden grid grid-cols-2 gap-2">
                {visible.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="text-left rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                  >
                    <p className="text-xs font-semibold text-slate-900 truncate">{nameOf(a)}</p>
                    <p className="text-[11px] text-slate-500 truncate">{patientOf(a)}</p>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize truncate">{a._pending ? "En attente" : a.status || "—"}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : ""}</span>
                    </div>
                  </button>
                ))}
              </div>
              {analyses.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
            </>
          )}
        </CardContent>
      </Card>

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected ? nameOf(selected) : "Analyse"}
        subtitle={selected ? patientOf(selected) : undefined}
        badge={selected?.status ? <Badge variant="alliya-turquoise-outline" className="capitalize">{selected.status}</Badge> : undefined}
        fields={selected ? detailFields(selected) : []}
      >
        {selected && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canEnterResult && selected.specimen_id ? (
              <Button
                className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]"
                onClick={() => { setResultTarget(selected); setSelected(null); }}
              >
                Saisir le résultat
              </Button>
            ) : canCollect ? (
              <Button
                className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]"
                onClick={() => { setSpecimenTarget(selected); setSelected(null); }}
              >
                Enregistrer le prélèvement
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/resultats">Voir les résultats</Link>
            </Button>
          </div>
        )}
      </DetailDialog>

      <ResultFormDialog
        open={!!resultTarget}
        onOpenChange={(open) => { if (!open) setResultTarget(null); }}
        laboratoryId={user?.laboratory_id}
        specimenId={resultTarget?.specimen_id ?? null}
        testId={resultTarget?.test_catalog_id ?? null}
        onSaved={() => { void load(); }}
      />

      <SpecimenFormDialog
        open={!!specimenTarget}
        onOpenChange={(open) => { if (!open) setSpecimenTarget(null); }}
        laboratoryId={user?.laboratory_id}
        patientId={specimenTarget?.patient_id ?? null}
        orderId={specimenTarget?.order_id ?? specimenTarget?.order?.id ?? null}
        visitId={specimenTarget?.visit_id ?? specimenTarget?.visit?.id ?? null}
        onCreated={(created) => {
          if (created?.id) {
            setOptimisticRows((prev) => [{ ...created, _pending: true }, ...prev]);
          }
          void load();
        }}
      />
    </div>
  );
}