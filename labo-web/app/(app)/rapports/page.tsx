"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api, toList } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReportDeliverDialog } from "@/components/forms/report-deliver-dialog";
import { BarChart3, Users, FlaskConical, ClipboardCheck, Calendar, FileText, TrendingUp, Download, Truck } from "lucide-react";
import Link from "next/link";

const DELIVERY_MODE_LABELS: Record<string, string> = {
  remise_en_main_propre: "Remise en main propre",
  email: "Email",
  retrait: "Retrait sur place",
  envoi: "Envoi postal",
};

export default function RapportsPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();

  const [reports, setReports] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [deliverOpen, setDeliverOpen] = React.useState(false);
  const [deliveries, setDeliveries] = React.useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = React.useState(false);

  const canDeliver = hasPermission("reports.generate");

  const statsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    return api.safeGet<any>(`/reports/dashboard?laboratory_id=${user.laboratory_id}`);
  }, { enabled: !!user?.laboratory_id });

  const reportsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    return api.safeGet<any>(`/reports?laboratory_id=${user.laboratory_id}`);
  }, { enabled: !!user?.laboratory_id });

  React.useEffect(() => {
    const payload: any = reportsResult.data;
    const list = Array.isArray(payload) ? payload : (payload?.items ?? payload?.data ?? []);
    setReports(Array.isArray(list) ? list : []);
  }, [reportsResult.data]);

  const loadDeliveries = React.useCallback(async (reportId: string) => {
    if (!user?.laboratory_id) return;
    setDeliveriesLoading(true);
    try {
      const res = await api.get<any>(`/reports/${reportId}/deliveries?laboratory_id=${user.laboratory_id}`);
      const data = toList(res.data);
      setDeliveries(data);
    } catch {
      setDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  }, [user?.laboratory_id]);

  React.useEffect(() => {
    if (selected?.id) {
      loadDeliveries(selected.id);
    } else {
      setDeliveries([]);
    }
  }, [selected?.id, loadDeliveries]);

  const download = async (report: any) => {
    if (!user?.laboratory_id) return;
    setDownloading(report.id);
    try {
      await api.download(`/reports/${report.id}/pdf?laboratory_id=${user.laboratory_id}`, `${report.matricule || "rapport"}.pdf`);
    } catch (err: any) {
    } finally {
      setDownloading(null);
    }
  };

  const openDeliver = (report: any) => {
    setSelected(report);
    setDeliverOpen(true);
  };

  const closeDeliver = () => {
    setDeliverOpen(false);
  };

  const loading = statsResult.loading;
  const stats = (statsResult.data as any)?.data || statsResult.data || {};

  const cards = [
    { label: "Patients", value: stats.patients ?? stats.total_patients ?? "—", icon: Users, href: "/patients", color: "text-[#1E2A47]", bg: "bg-slate-100" },
    { label: "Analyses", value: stats.analyses ?? stats.total_analyses ?? "—", icon: FlaskConical, href: "/analyses", color: "text-[#2E7A7C]", bg: "bg-[#3D9597]/10" },
    { label: "Résultats", value: stats.results ?? stats.total_results ?? "—", icon: ClipboardCheck, href: "/resultats", color: "text-[#2E7A7C]", bg: "bg-[#3D9597]/10" },
    { label: "Rendez-vous", value: stats.appointments ?? stats.total_appointments ?? "—", icon: Calendar, href: "/rendez-vous", color: "text-amber-700", bg: "bg-amber-50" },
  ];

  const sections = [
    { title: "Activité patients", desc: "Consulter les dossiers, visites et historiques.", href: "/patients/dossiers", icon: Users },
    { title: "Résultats & validations", desc: "Suivre les résultats saisis et leur validation.", href: "/validations", icon: ClipboardCheck },
    { title: "Prélèvements & analyses", desc: "État des échantillons et analyses en cours.", href: "/prelevements", icon: FlaskConical },
    { title: "Facturation", desc: "Aperçu des factures et paiements.", href: "/facturation", icon: FileText },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader title="Rapports" description="Rapports d\'activité et statistiques du laboratoire" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}>
              <Card className="border border-[#E5E7EB] hover:shadow-sm transition-shadow h-full">
                <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
                  <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}><Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.color}`} /></div>
                  <div className="min-w-0"><p className="text-[11px] sm:text-sm text-slate-500 truncate">{c.label}</p><p className={`text-lg sm:text-2xl font-bold leading-tight ${c.color}`}>{loading ? "…" : c.value}</p></div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border border-[#E5E7EB]">
        <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Vue d\'ensemble</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.title} href={s.href} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-[#3D9597]/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-[#2E7A7C]" /></div>
                    <div className="min-w-0"><p className="text-sm font-medium text-slate-900">{s.title}</p><p className="text-xs text-slate-500 mt-0.5">{s.desc}</p></div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[#E5E7EB]">
        <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Rapports générés</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          {reportsResult.loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aucun rapport généré pour le moment.</p>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r)}
                    className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">{r.matricule || "—"}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{r.title || r.type || "Rapport"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}
                      {r.patient_name ? ` · ${r.patient_name}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); void download(r); }} disabled={downloading === r.id}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />{downloading === r.id ? "…" : "PDF"}
                      </Button>
                      {canDeliver && r.status !== "remis" && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDeliver(r); }}>
                          <Truck className="h-3.5 w-3.5 mr-1.5" />Livrer
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3">Matricule</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r); } }}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                      >
                        <td className="p-3 font-mono text-xs">{r.matricule || "—"}</td>
                        <td className="p-3">{r.title || r.type || "—"}</td>
                        <td className="p-3">{r.patient_name || "—"}</td>
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                        <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); void download(r); }} disabled={downloading === r.id}>
                              <Download className="h-4 w-4 mr-1.5" />{downloading === r.id ? "…" : "PDF"}
                            </Button>
                            {canDeliver && r.status !== "remis" && (
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDeliver(r); }}>
                                <Truck className="h-4 w-4 mr-1.5" />Livrer
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.matricule || "Rapport"}
        subtitle={selected?.title || selected?.type || undefined}
        badge={selected?.status ? <StatusBadge status={selected.status} /> : undefined}
        fields={selected ? [
          { label: "Type", value: selected.type || "—" },
          { label: "Patient", value: selected.patient_name || "—" },
          { label: "Période", value: selected.period || "—" },
          { label: "Statut", value: <StatusBadge status={selected.status} /> },
          { label: "Généré le", value: selected.created_at ? new Date(selected.created_at).toLocaleString("fr-FR") : "—" },
          { label: "Notes", value: selected.notes, wide: true },
        ] : []}
      >
        {selected && (
          <>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" onClick={() => void download(selected)} disabled={downloading === selected.id}>
                <Download className="h-4 w-4 mr-2" />Télécharger le PDF
              </Button>
              {canDeliver && selected.status !== "remis" && (
                <Button size="sm" variant="outline" onClick={() => openDeliver(selected)}>
                  <Truck className="h-4 w-4 mr-2" />Livrer
                </Button>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-[#3D9597]" /> Remises</h3>
              {deliveriesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : deliveries.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune remise enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map((d: any) => (
                    <div key={d.id} className="rounded-lg border border-slate-100 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-slate-800">{d.recipient_name || "—"}</span>
                        <span className="text-slate-400">·</span>
                        <span className="capitalize text-slate-600">{d.recipient_relation || "—"}</span>
                        <span className="text-slate-400">·</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                          {DELIVERY_MODE_LABELS[d.delivery_mode] || d.delivery_mode || "—"}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{d.delivered_at ? new Date(d.delivered_at).toLocaleString("fr-FR") : "—"}</span>
                        {d.delivered_by && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">par {d.delivered_by}</span>
                          </>
                        )}
                      </div>
                      {d.notes && (
                        <p className="mt-2 text-sm text-slate-600 italic">{d.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <ReportDeliverDialog
          open={deliverOpen}
          onOpenChange={closeDeliver}
          report={selected}
          onSaved={() => { if (selected?.id) loadDeliveries(selected.id); }}
        />
      </DetailDialog>
    </div>
  );
}
