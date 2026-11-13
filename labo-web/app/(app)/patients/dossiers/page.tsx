"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useLabPatients } from "@/lib/use-lab-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, User } from "lucide-react";
import Link from "next/link";
import { PatientCarnetFormDialog } from "@/components/forms/patient-carnet-form-dialog";

const PAGE_SIZE = 10;

export default function DossiersPage() {
  const { user } = useAuth();
  useRoleGuard();
  const { patients } = useLabPatients(user?.laboratory_id);
  const [carnets, setCarnets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [open, setOpen] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.laboratory_id) { setLoading(false); return; }
    setLoading(true);
    const res = await api.safeGet<any>(`/patient-carnets?laboratory_id=${user.laboratory_id}`);
    const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data;
    setCarnets(Array.isArray(list) ? list : []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => { setVisible(PAGE_SIZE); }, [carnets.length]);

  const nameOf = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient" : "Patient";
  };

  const shown = carnets.slice(0, visible);
  const hasMore = visible < carnets.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, carnets.length));
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, carnets.length]);

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Dossiers médicaux"
        description="Carnets de suivi et historique des patients"
        action={
          <Button variant="alliya-turquoise" size="sm" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau dossier
          </Button>
        }
      />

      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : carnets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-500">Aucun dossier patient.</p>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Créer un dossier
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {shown.map((c) => (
                  <Link key={c.id} href={`/patients/carnet/${c.id}`} className="block">
                    <Card className="border border-[#E5E7EB] shadow-sm transition-colors hover:border-[#3D9597]/40">
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />{nameOf(c.patient_id)}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500">{c.matricule || "—"}</p>
                        </div>
                        <Badge variant="alliya-turquoise-outline" className="shrink-0 text-[10px]">{c.visit_count ?? 0} visite(s)</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F5F8FA] text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Matricule</th>
                      <th className="p-3 font-medium">Patient</th>
                      <th className="p-3 font-medium">Visites</th>
                      <th className="p-3 font-medium">Ouvert le</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id} className="border-b border-[#EEF2F6] transition-colors hover:bg-[#F5F8FA]">
                        <td className="p-3 font-mono text-xs">{c.matricule || "—"}</td>
                        <td className="p-3">{nameOf(c.patient_id)}</td>
                        <td className="p-3">{c.visit_count ?? 0}</td>
                        <td className="p-3">{c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="p-3 text-right">
                          <Link href={`/patients/carnet/${c.id}`}>
                            <Button variant="ghost" size="sm">Ouvrir</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {hasMore && <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
        </CardContent>
      </Card>

      <PatientCarnetFormDialog
        open={open}
        onOpenChange={setOpen}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void load(); }}
      />
    </div>
  );
}