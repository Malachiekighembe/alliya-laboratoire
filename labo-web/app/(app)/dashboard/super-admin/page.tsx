"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Building2, Users, CreditCard, AlertCircle, ArrowRight, Plus, Activity } from "lucide-react";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.08 } } };

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [subs, setSubs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, s] = await Promise.all([api.safeGet<any[]>("/laboratories"), api.safeGet<any[]>("/subscriptions")]);
        if (cancelled) return;
        setLabs(!l.error && Array.isArray(l.data) ? l.data : []);
        setSubs(!s.error && Array.isArray(s.data) ? s.data : []);
      } catch {
        // ne bloque pas l'UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalLabs = labs.length;
  const activeLabs = labs.filter((l) => l.is_active !== false).length;
  const totalUsers = labs.reduce((s, l) => s + (l.stats?.users_count || 0), 0);
  const activeSubs = subs.filter((s) => s.status === "active").length;
  const incompleteLabs = labs.filter((l) => !l.address || !l.phone || !l.email);

  return (
    <MotionDiv variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp}>
        <PageHeader
          title="Administration du système"
          description={`Bienvenue ${user?.first_name || ""} ${user?.last_name || ""} — gérez les laboratoires, responsables et abonnements.`}
        />
      </MotionDiv>

      <MotionDiv variants={stagger} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Laboratoires", value: totalLabs, sub: `${activeLabs} actif(s)`, icon: <Building2 className="h-5 w-5" />, href: "/admin/laboratoires" },
          { label: "Utilisateurs", value: totalUsers, sub: "tous laboratoires", icon: <Users className="h-5 w-5" />, href: "/admin/utilisateurs" },
          { label: "Abonnements actifs", value: activeSubs, sub: `${subs.length} au total`, icon: <CreditCard className="h-5 w-5" />, href: "/admin/abonnements" },
          { label: "Profils incomplets", value: incompleteLabs.length, sub: "laboratoires à compléter", icon: <AlertCircle className="h-5 w-5" />, href: "/admin/laboratoires" },
        ].map((c) => (
          <MotionDiv key={c.label} variants={fadeUp}>
            <Link href={c.href}>
              <Card className="border-slate-200 hover:border-[#3D9597]/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="pt-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? "…" : c.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center">{c.icon}</div>
                </CardContent>
              </Card>
            </Link>
          </MotionDiv>
        ))}
      </MotionDiv>

      <MotionDiv variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Actions rapides</CardTitle>
            <Activity className="h-4 w-4 text-[#3D9597]" />
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link href="/admin/laboratoires" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-[#3D9597]/50 hover:bg-[#07122E]/5 transition-colors">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-2"><Plus className="h-4 w-4 text-[#07122E]" /> Créer un laboratoire</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/admin/utilisateurs" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-[#3D9597]/50 hover:bg-[#07122E]/5 transition-colors">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-2"><Users className="h-4 w-4 text-[#07122E]" /> Ajouter un responsable</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/admin/abonnements" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-[#3D9597]/50 hover:bg-[#07122E]/5 transition-colors">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#07122E]" /> Gérer les abonnements</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/profil" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-[#3D9597]/50 hover:bg-[#07122E]/5 transition-colors">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-[#07122E]" /> Compléter mon profil</span><ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Laboratoires récents</CardTitle>
            <Link href="/admin/laboratoires" className="text-xs text-[#07122E] hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
            ) : labs.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">
                Aucun laboratoire. <Link href="/admin/laboratoires" className="text-[#07122E] underline">Créez le premier</Link> avec son responsable.
              </div>
            ) : (
              <div className="space-y-2">
                {labs.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{l.name || "(Sans nom)"}</p>
                      <p className="text-xs text-slate-400">{l.code || "—"} · {l.stats?.users_count ?? 0} utilisateur(s)</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.is_active !== false ? "bg-[#3D9597]/10 text-[#07122E] border border-[#3D9597]/20" : "bg-slate-100 text-slate-600"}`}>{l.is_active !== false ? "Actif" : "Inactif"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </MotionDiv>

      {loading && <p className="text-xs text-slate-400">Chargement des données… (l’interface reste disponible)</p>}
    </MotionDiv>
  );
}

