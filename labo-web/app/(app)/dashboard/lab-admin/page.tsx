"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/page-header";
import { Users, FlaskConical, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";

const fadeUp: any = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

export default function LabAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({ patients: 0, analyses: 0, pending: 0, validated: 0 });
  const [profileMiss, setProfileMiss] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const labId = user?.laboratory_id;
        if (labId) {
          const [p, r] = await Promise.allSettled([
            api.safeGet<any[]>(`/patients?laboratory_id=${labId}`),
            api.safeGet<any[]>(`/results?laboratory_id=${labId}`),
          ]);
          if (cancelled) return;
          const patients = p.status === "fulfilled" && !p.value.error && Array.isArray(p.value.data) ? p.value.data : [];
          const results = r.status === "fulfilled" && !r.value.error && Array.isArray(r.value.data) ? r.value.data : [];
          setStats({
            patients: patients.length,
            analyses: results.length,
            pending: results.filter((x: any) => x.status === "pending" || x.status === "en_attente").length,
            validated: results.filter((x: any) => x.status === "validated" || x.status === "valide").length,
          });
          const labRes = await api.safeGet<any>(`/laboratories/${labId}`);
          if (!cancelled && !labRes.error && labRes.data) {
            const l = labRes.data; const m: string[] = [];
            if (!l.name) m.push("nom"); if (!l.address) m.push("adresse"); if (!l.phone) m.push("téléphone"); if (!l.email) m.push("email");
            setProfileMiss(m);
          }
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const cards = [
    { label: "Patients", value: stats.patients, icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, sub: "Inscrits" },
    { label: "Analyses", value: stats.analyses, icon: <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, sub: "Total" },
    { label: "En attente", value: stats.pending, icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, sub: "À traiter" },
    { label: "Validés", value: stats.validated, icon: <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, sub: "Résultats" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 sm:space-y-5">
      <motion.div variants={fadeUp}>
        <PageHeader title="Tableau de bord — Responsable" description={`Bienvenue ${user?.first_name || ""}. Gérez votre laboratoire.`} />
      </motion.div>

      {profileMiss.length > 0 && (
        <motion.div variants={fadeUp} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 sm:px-3 sm:py-2.5 text-amber-800 text-[11px] sm:text-xs">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div><span className="font-medium">Profil labo incomplet :</span> {profileMiss.join(", ")}. <a href="/profil" className="underline font-medium">Compléter</a></div>
        </motion.div>
      )}

      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {cards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full">
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{c.label}</p>
                <p className="text-sm sm:text-xl font-bold text-slate-900">{loading ? "…" : c.value}</p>
                <p className="text-[10px] text-slate-400 truncate">{c.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-4">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Actions rapides</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
            {[{ href: "/personnel", label: "Personnel" }, { href: "/patients", label: "Patients" }, { href: "/analyses", label: "Analyses" }, { href: "/profil", label: "Profil" }].map(a => (
              <a key={a.href} href={a.href} className="rounded-md border border-slate-200 px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-700 text-center hover:border-[#3D9597]/40 hover:bg-[#07122E]/5 transition-colors">{a.label}</a>
            ))}
          </div>
        </div>
      </motion.div>
      {loading && <p className="text-[10px] text-slate-400">Chargement…</p>}
    </motion.div>
  );
}
