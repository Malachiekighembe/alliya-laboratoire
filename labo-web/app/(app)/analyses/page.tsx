"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalysesPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [analyses, setAnalyses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    api.get<any[]>(`/analyses?laboratory_id=${user.laboratory_id}`).then((res) => {
      setAnalyses(res.success ? (Array.isArray(res.data) ? res.data : []) : []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyses"
        description="Commandes d'analyses et suivi des échantillons"
        action={
        <Button variant="alliya-turquoise" size="sm">
          <FlaskConical className="h-4 w-4 mr-2" /> Nouvelle analyse
        </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analyses en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {analyses.map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{a.matricule}</td>
                    <td className="p-3">{a.test_name || "—"}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3">{a.priority || "normale"}</td>
                    <td className="p-3">{a.order_date || "—"}</td>
                  </tr>
                ))}
                {analyses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground text-center py-4">
                      Aucune analyse trouvée.
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
