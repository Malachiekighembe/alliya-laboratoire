"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Search } from "lucide-react";

export default function PersonnelPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [staff, setStaff] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    api.get<any[]>(`/users?laboratory_id=${user.laboratory_id}`).then((res) => {
      setStaff(res.success ? (Array.isArray(res.data) ? res.data : []) : []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel"
        description="Gestion des utilisateurs et du personnel du laboratoire"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres du personnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rôle(s)</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{s.first_name} {s.last_name}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">{Array.isArray(s.roles) ? s.roles.join(", ") : "—"}</td>
                    <td className="p-3">{s.is_active ? "Actif" : "Inactif"}</td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground text-center py-4">
                      Aucun membre du personnel trouvé.
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
