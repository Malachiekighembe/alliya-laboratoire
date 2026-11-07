"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Search } from "lucide-react";

export default function ResultatsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    api.get<any[]>(`/resultats?laboratory_id=${user.laboratory_id}`).then((res) => {
      setResults(res.success ? (Array.isArray(res.data) ? res.data : []) : []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Résultats"
        description="Consultation et validation des résultats d'analyses"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Résultats récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{r.matricule}</td>
                    <td className="p-3">{r.test_name || "—"}</td>
                    <td className="p-3">{r.value || "—"}</td>
                    <td className="p-3">{r.unit || "—"}</td>
                    <td className="p-3">{r.status}</td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground text-center py-4">
                      Aucun résultat trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
