"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestFormDialog } from "@/components/forms/test-form-dialog";

export default function AnalysesPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [analyses, setAnalyses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [createOpen, setCreateOpen] = React.useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    setLoading(true);
    const res = await api.safeGet<any>(`/examinations?laboratory_id=${user.laboratory_id}`);
    const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data;
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
  const visible = analyses.slice(0, visibleCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analyses"
        description="Commandes d'analyses et suivi des échantillons"
        action={
          <Button size="sm" className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <FlaskConical className="h-4 w-4 mr-2" /> Nouvelle analyse
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
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((a) => (
                      <tr key={a.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3">{a.matricule || a.patient_name || "—"}</td>
                        <td className="p-3">{a.test_name || a.name || "—"}</td>
                        <td className="p-3 capitalize">{a.status || "—"}</td>
                        <td className="p-3">{a.priority || "normale"}</td>
                        <td className="p-3">{a.order_date || (a.created_at ? String(a.created_at).slice(0,10) : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden grid grid-cols-2 gap-2">
                {visible.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{a.test_name || a.name || "Analyse"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{a.matricule || a.patient_name || "—"}</p>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize truncate">{a.status || "—"}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{a.order_date || (a.created_at ? String(a.created_at).slice(5,10) : "")}</span>
                    </div>
                  </div>
                ))}
              </div>
              {analyses.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
            </>
          )}
        </CardContent>
      </Card>

      <TestFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void load(); }}
      />
    </div>
  );
}
