"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useLab } from "@/components/lab/LabProvider";
import { api, toList } from "@/lib/api-client";
import { PageHeader } from "@/components/ui";
import { FlaskConical, Microscope, ClipboardList, Users } from "lucide-react";
import Link from "next/link";

const fadeUp: any = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

export default function TechnicianDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ analyses: 0, specimens: 0, pending: 0, completed: 0 });

  React.useEffect(() => {
    if (!activeLabId) { setLoading(false); return; }
    const filter = `?laboratory_id=${activeLabId}`;
    Promise.all([
      api.get<any>(`/analyses${filter}`),
      api.get<any>(`/specimens${filter}`),
    ]).then(([a, s]) => {
      const analyses = a.success ? toList<any>(a.data) : [];
      const specimens = s.success ? toList<any>(s.data) : [];
      const done = analyses.filter((x: any) => ["terminee", "complete", "completed"].includes(x.status)).length;
      setStats({
        analyses: analyses.length,
        specimens: specimens.length,
        pending: analyses.filter((x: any) => ["en_attente", "pending"].includes(x.status)).length,
        completed: done,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeLabId]);

  const cards = [
    { label: "Analyses", value: stats.analyses, icon: <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/analyses" },
    { label: "Échantillons", value: stats.specimens, icon: <Microscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/prelevements" },
    { label: "En attente", value: stats.pending, icon: <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/analyses" },
    { label: "Terminés", value: stats.completed, icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, href: "/resultats" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 sm:space-y-5">
      <motion.div variants={fadeUp}><PageHeader title="Espace technicien" description="Analyses et échantillons" /></motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {cards.map((c) => (<motion.div key={c.label} variants={fadeUp}><Link href={c.href} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"><div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full transition-colors hover:border-[#3D9597]/50 hover:bg-[#3D9597]/5"><div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0">{c.icon}</div><div className="min-w-0 leading-tight"><p className="text-[10px] sm:text-xs text-slate-500 truncate">{c.label}</p><p className="text-sm sm:text-xl font-bold text-slate-900">{loading ? "…" : c.value}</p></div></div></Link></motion.div>))}
      </motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-3">
        {[{ title: "Analyses", text: "À réaliser." }, { title: "Échantillons", text: "Réception." }, { title: "Résultats", text: "Saisie." }].map((b) => (<motion.div key={b.title} variants={fadeUp} className={b.title === "Résultats" ? "col-span-2 sm:col-span-1" : ""}><div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full"><p className="text-[11px] sm:text-sm font-semibold text-slate-800">{b.title}</p><p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{b.text}</p></div></motion.div>))}
      </motion.div>
    </motion.div>
  );
}
