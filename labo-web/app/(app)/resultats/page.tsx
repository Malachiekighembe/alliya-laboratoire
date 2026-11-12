"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResultatsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(10);
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
                      <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3">{r.matricule || "—"}</td>
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
                  <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{r.test_name || "Résultat"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{r.matricule || "—"}</p>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[11px] font-medium text-slate-800 truncate">{r.value ?? "—"} {r.unit || ""}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize shrink-0">{r.status || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
              {results.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
