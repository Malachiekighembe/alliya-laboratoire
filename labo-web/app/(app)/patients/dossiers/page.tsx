"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DossiersPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [visits, setVisits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    api.get<any[]>(`/visits?laboratory_id=${user.laboratory_id}`).then((res) => {
      setVisits(res.success ? (Array.isArray(res.data) ? res.data : []) : []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers médicaux"
        description="Visites et antécédents des patients"
        action={
          <Link href="/patients/nouveau">
            <Button variant="alliya-turquoise" size="sm">
              <FileText className="h-4 w-4 mr-2" /> Nouveau dossier
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dossiers des patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Date de visite</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Médecin</th>
                  <th className="p-3">Motif</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{v.matricule}</td>
                    <td className="p-3">{v.visit_date}</td>
                    <td className="p-3">{v.status}</td>
                    <td className="p-3">{v.practitioner_id || "—"}</td>
                    <td className="p-3">{v.reason || "—"}</td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground text-center py-4">
                      Aucun dossier trouvé.
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
