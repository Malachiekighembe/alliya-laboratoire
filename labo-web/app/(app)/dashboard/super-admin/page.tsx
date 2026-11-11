"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui";
import { Building2, Users, CreditCard, AlertCircle, ArrowRight, Plus, Activity } from "lucide-react";

const fadeUp: any = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

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
      } catch {} finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalLabs = labs.length;
  const activeLabs = labs.filter((l) => l.is_active !== false).length;
  const totalUsers = labs.reduce((s, l) => s + (l.stats?.users_count || 0), 0);
  const activeSubs = subs.filter((s) => s.status === "active").length;
  const incompleteLabs = labs.filter((l) => !l.address || !l.phone || !l.email);

  const stats = [
    { label: "Laboratoires", value: totalLabs, sub: `${activeLabs} actifs`, icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/admin/laboratoires" },
    { label: "Utilisateurs", value: totalUsers, sub: "tous labos", icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/admin/utilisateurs" },
    { label: "Abonnements", value: activeSubs, sub: `${subs.length} total`, icon: <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/admin/abonnements" },
    { label: "Incomplets", value: incompleteLabs.length, sub: "profils", icon: <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/admin/laboratoires" },
  ];

  const actions = [
    { href: "/admin/laboratoires", label: "Créer labo", icon: <Plus className="h-3.5 w-3.5" /> },
    { href: "/admin/utilisateurs", label: "Responsable", icon: <Users className="h-3.5 w-3.5" /> },
    { href: "/admin/abonnements", label: "Abonnements", icon: <CreditCard className="h-3.5 w-3.5" /> },
    { href: "/profil", label: "Mon profil", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 sm:space-y-5">
      <motion.div variants={fadeUp}>
        <PageHeader title="Administration du système" description={`Bienvenue ${user?.first_name || ""} — gérez laboratoires, responsables et abonnements.`} />
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {stats.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <Link href={c.href} className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 hover:border-[#3D9597]/40 hover:shadow-sm transition-all h-full">
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="min-w-0 leading-tight flex-1">
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{c.label}</p>
                <p className="text-sm sm:text-xl font-bold text-slate-900">{loading ? "…" : c.value}</p>
                <p className="text-[10px] text-slate-400 truncate">{c.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-2 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Actions rapides</p>
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#3D9597]" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center justify-between gap-1 rounded-md border border-slate-200 px-2 py-1.5 sm:px-3 sm:py-2 hover:border-[#3D9597]/40 hover:bg-[#07122E]/5 transition-colors min-w-0">
                <span className="text-[11px] sm:text-xs font-medium text-slate-700 flex items-center gap-1.5 min-w-0 truncate">{a.icon}<span className="truncate">{a.label}</span></span>
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Laboratoires récents</p>
            <Link href="/admin/laboratoires" className="text-[10px] sm:text-xs text-[#07122E] hover:underline">Voir tout</Link>
          </div>
          {loading ? (
            <div className="space-y-1.5">{[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
          ) : labs.length === 0 ? (
            <div className="text-[11px] sm:text-xs text-slate-500 py-3 text-center">Aucun laboratoire. <Link href="/admin/laboratoires" className="text-[#07122E] underline">Créer</Link></div>
          ) : (
            <div className="space-y-1.5">
              {labs.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium text-slate-800 truncate">{l.name || "(Sans nom)"}</p>
                    <p className="text-[10px] text-slate-400 truncate">{l.code || "—"} · {l.stats?.users_count ?? 0} util.</p>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${l.is_active !== false ? "bg-[#3D9597]/10 text-[#07122E] border border-[#3D9597]/20" : "bg-slate-100 text-slate-600"}`}>{l.is_active !== false ? "Actif" : "Inactif"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {loading && <p className="text-[10px] text-slate-400">Chargement…</p>}
    </motion.div>
  );
}
