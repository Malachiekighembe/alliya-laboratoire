"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, FlaskConical, ClipboardCheck, Calendar, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function RapportsPage() {
  const { user } = useAuth();
  useRoleGuard();

  const statsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    return api.safeGet<any>(`/dashboard/stats?laboratory_id=${user.laboratory_id}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = statsResult.loading;
  const stats = (statsResult.data as any)?.data || statsResult.data || {};

  const cards = [
    { label: "Patients", value: stats.patients ?? stats.total_patients ?? "—", icon: Users, href: "/patients", color: "text-[#1E2A47]", bg: "bg-slate-100" },
    { label: "Analyses", value: stats.analyses ?? stats.total_analyses ?? "—", icon: FlaskConical, href: "/analyses", color: "text-[#2E7A7C]", bg: "bg-[#3D9597]/10" },
    { label: "Résultats", value: stats.results ?? stats.total_results ?? "—", icon: ClipboardCheck, href: "/resultats", color: "text-emerald-700", bg: "bg-emerald-50" },
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
      <PageHeader title="Rapports" description="Rapports d'activité et statistiques du laboratoire" />

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
        <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Vue d'ensemble</CardTitle></CardHeader>
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
        <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Rapports détaillés</CardTitle></CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 sm:p-6 text-center">
            <BarChart3 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#3D9597]/50 mb-2" />
            <p className="text-sm text-slate-600">Générez et consultez les rapports d'activité de votre laboratoire.</p>
            <p className="text-xs text-slate-400 mt-1">Les exports et rapports avancés seront disponibles ici.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link href="/patients/dossiers"><Button variant="outline" size="sm" className="w-auto h-8 text-xs">Dossiers</Button></Link>
              <Link href="/resultats"><Button variant="outline" size="sm" className="w-auto h-8 text-xs">Résultats</Button></Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
