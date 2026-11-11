"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminUtilisateursPage() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [usersByLab, setUsersByLab] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<any[]>("/laboratories");
        const labList = Array.isArray(res.data) ? res.data : [];
        setLabs(labList);
        const entries = await Promise.all(
          labList.map(async (lab) => {
            try {
              const u = await api.get<any[]>(`/users?laboratory_id=${lab.id}`);
              return [lab.id, Array.isArray(u.data) ? u.data : []] as [string, any[]];
            } catch {
              return [lab.id, []] as [string, any[]];
            }
          })
        );
        setUsersByLab(Object.fromEntries(entries));
      } catch {
        setLabs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  const totalUsers = Object.values(usersByLab).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Utilisateurs système" description="Vue d'ensemble des utilisateurs par laboratoire" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-[#E5E7EB]">
          <CardHeader><CardTitle className="text-base">Total utilisateurs</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalUsers}</p></CardContent>
        </Card>
        <Card className="border border-[#E5E7EB]">
          <CardHeader><CardTitle className="text-base">Laboratoires</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{labs.length}</p></CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-4">
          {labs.map((lab) => {
            const users = usersByLab[lab.id] || [];
            return (
              <Card key={lab.id} className="border border-[#E5E7EB]">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600" />
                    <CardTitle className="text-base">{lab.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">({users.length} utilisateurs)</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F9FAFB]">
                          <tr>
                            <th className="text-left px-3 py-2 text-muted-foreground">Nom</th>
                            <th className="text-left px-3 py-2 text-muted-foreground">Email</th>
                            <th className="text-left px-3 py-2 text-muted-foreground">Rôles</th>
                            <th className="text-left px-3 py-2 text-muted-foreground">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u: any) => (
                            <tr key={u.id} className="border-t border-[#E5E7EB]">
                              <td className="px-3 py-2">{u.first_name} {u.last_name}</td>
                              <td className="px-3 py-2">{u.email || "—"}</td>
                              <td className="px-3 py-2">{Array.isArray(u.roles) ? u.roles.join(", ") : "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                  {u.is_active !== false ? "Actif" : "Inactif"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {labs.length === 0 && <p className="text-muted-foreground">Aucun laboratoire.</p>}
        </div>
      )}
    </MotionDiv>
  );
}
