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

export default function ResultatsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [selected, setSelected] = React.useState<any | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    api.safeGet<any[]>(`/results?laboratory_id=${user.laboratory_id}`).then((res) => {
      setResults(!res.error && Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [user]);

  React.useEffect(() => { setVisibleCount(10); }, [results.length]);
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => c + 10);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [results.length, visibleCount]);

  if (loading) return <div className="p-6 flex items-center justify-center text-slate-500">Chargement…</div>;
  const visible = results.slice(0, visibleCount);

  const patientName = (r: any) =>
    r.patient_name || [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(" ") || "—";

  const detailFields = (r: any) => [
    { label: "Patient", value: patientName(r) },
    { label: "Matricule", value: r.matricule, mono: true },
    { label: "Analyse", value: r.test_name || r.test_catalog?.name || "—" },
    { label: "Valeur", value: r.value ?? "—" },
    { label: "Unité", value: r.unit || r.test_catalog?.unit || "—" },
    { label: "Statut", value: r.status ? <StatusBadge status={r.status} /> : "—" },
    { label: "Date", value: r.result_date || (r.created_at ? String(r.created_at).slice(0, 10) : "—") },
    { label: "Validé par", value: r.validated_by?.first_name ? `${r.validated_by.first_name} ${r.validated_by.last_name ?? ""}`.trim() : "—" },
    { label: "Commentaire", value: r.comments || r.notes, wide: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Résultats" description="Consultation et validation des résultats d'analyses" />
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Résultats récents</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">Aucun résultat trouvé.</p>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Test</th>
                      <th className="p-3">Valeur</th>
                      <th className="p-3">Unité</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r); } }}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D9597]/40"
                      >
                        <td className="p-3">{patientName(r)}</td>
                        <td className="p-3">{r.test_name || "—"}</td>
                        <td className="p-3">{r.value ?? "—"}</td>
                        <td className="p-3">{r.unit || "—"}</td>
                        <td className="p-3 capitalize">{r.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden grid grid-cols-2 gap-2">
                {visible.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r)}
                    className="text-left rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0 transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                  >
                    <p className="text-xs font-semibold text-slate-900 truncate">{r.test_name || "Résultat"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{patientName(r)}</p>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[11px] font-medium text-slate-800 truncate">{r.value ?? "—"} {r.unit || ""}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize shrink-0">{r.status || "—"}</span>
                    </div>
                  </button>
                ))}
              </div>
              {results.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
            </>
          )}
        </CardContent>
      </Card>

      <DetailDialog
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected ? (selected.test_name || "Résultat") : "Résultat"}
        subtitle={selected ? patientName(selected) : undefined}
        badge={selected?.status ? <Badge variant="alliya-turquoise-outline" className="capitalize">{selected.status}</Badge> : undefined}
        fields={selected ? detailFields(selected) : []}
      />
    </div>
  );
}