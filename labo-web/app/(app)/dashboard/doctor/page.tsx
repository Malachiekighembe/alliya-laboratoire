"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useLab } from "@/components/lab/LabProvider";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui";
import { Users, FlaskConical, ClipboardCheck, Stethoscope } from "lucide-react";

const fadeUp: any = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

export default function DoctorDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ patients: 0, analyses: 0, pending: 0, validated: 0 });

  React.useEffect(() => {
    if (!activeLabId) { setLoading(false); return; }
    const filter = `?laboratory_id=${activeLabId}`;
    Promise.all([api.get<any[]>(`/patients${filter}`), api.get<any[]>(`/resultats${filter}`)])
      .then(([p, r]) => {
        const patients = p.success && Array.isArray(p.data) ? p.data : [];
        const results = r.success && Array.isArray(r.data) ? r.data : [];
        setStats({
          patients: patients.length, analyses: results.length,
          pending: results.filter((x: any) => x.status === "pending" || x.status === "en_attente").length,
          validated: results.filter((x: any) => x.status === "validated" || x.status === "valide").length,
        });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [activeLabId]);

  const cards = [
    { label: "Mes patients", value: stats.patients, icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    { label: "Analyses", value: stats.analyses, icon: <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    { label: "En attente", value: stats.pending, icon: <ClipboardCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
    { label: "Validés", value: stats.validated, icon: <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 sm:space-y-5">
      <motion.div variants={fadeUp}><PageHeader title="Espace médecin" description="Patients et validation des résultats" /></motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {cards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full">
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="min-w-0 leading-tight"><p className="text-[10px] sm:text-xs text-slate-500 truncate">{c.label}</p><p className="text-sm sm:text-xl font-bold text-slate-900">{loading ? "…" : c.value}</p></div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-3">
        {[{ title: "Mes patients", text: "Patients assignés." }, { title: "À valider", text: `${stats.pending} en attente.` }, { title: "Analyses", text: "Suivi en cours." }].map((b) => (
          <motion.div key={b.title} variants={fadeUp} className={b.title === "Analyses" ? "col-span-2 sm:col-span-1" : ""}>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:p-3 h-full"><p className="text-[11px] sm:text-sm font-semibold text-slate-800">{b.title}</p><p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{b.text}</p></div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
