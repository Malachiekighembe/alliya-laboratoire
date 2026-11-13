"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useLab } from "@/components/lab/LabProvider";
import { api, toList } from "@/lib/api-client";
import { PageHeader } from "@/components/ui";
import { Users, FlaskConical, ClipboardCheck, Eye } from "lucide-react";
import Link from "next/link";

const fadeUp: any = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

export default function ViewerDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ patients: 0, analyses: 0, results: 0 });

  React.useEffect(() => {
    if (!activeLabId) { setLoading(false); return; }
    const f = `?laboratory_id=${activeLabId}`;
    Promise.all([api.get<any>(`/patients${f}`), api.get<any>(`/analyses${f}`), api.get<any>(`/results${f}`)])
      .then(([p, a, r]) => {
        setStats({
          patients: p.success ? toList<any>(p.data).length : 0,
          analyses: a.success ? toList<any>(a.data).length : 0,
          results: r.success ? toList<any>(r.data).length : 0,
        }); setLoading(false);
      }).catch(() => setLoading(false));
  }, [activeLabId]);

  const cards = [
    { label: "Patients", value: stats.patients, icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/patients" },
    { label: "Analyses", value: stats.analyses, icon: <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/analyses" },
    { label: "Résultats", value: stats.results, icon: <ClipboardCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/resultats" },
    { label: "Mode", value: "Lecture", icon: <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/parametres" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 sm:space-y-5">
      <motion.div variants={fadeUp}><PageHeader title="Accès en lecture seule" description="Consultation des données du laboratoire" /></motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {cards.map((c) => (<motion.div key={c.label} variants={fadeUp}><Link href={c.href} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"><div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5"><div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0">{c.icon}</div><div className="min-w-0 leading-tight"><p className="text-[10px] sm:text-xs text-slate-500 truncate">{c.label}</p><p className="text-sm sm:text-xl font-bold text-slate-900">{loading ? "…" : c.value}</p></div></div></Link></motion.div>))}
      </motion.div>
      <motion.div variants={fadeUp}><div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 sm:p-3 flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-slate-500 shrink-0" /><p className="text-[10px] sm:text-xs text-slate-600">Accès en lecture seule — certaines actions restreintes.</p></div></motion.div>
    </motion.div>
  );
}
