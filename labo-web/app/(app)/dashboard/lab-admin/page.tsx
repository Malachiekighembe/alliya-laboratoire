"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskConical, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.08 } } };

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
      } catch {
        // UI non bloquée
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const cards = [
    { label: "Patients", value: stats.patients, icon: <Users className="h-5 w-5" />, sub: "Inscrits" },
    { label: "Analyses", value: stats.analyses, icon: <FlaskConical className="h-5 w-5" />, sub: "Total" },
    { label: "En attente", value: stats.pending, icon: <Clock className="h-5 w-5" />, sub: "À traiter" },
    { label: "Validés", value: stats.validated, icon: <CheckCircle className="h-5 w-5" />, sub: "Résultats" },
  ];

  return (
    <MotionDiv variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp}>
        <PageHeader title="Tableau de bord — Responsable labo" description={`Bienvenue ${user?.first_name || ""} ${user?.last_name || ""}. Gérez votre laboratoire et votre équipe.`} />
      </MotionDiv>

      {profileMiss.length > 0 && (
        <MotionDiv variants={fadeUp} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Profil du laboratoire incomplet</p><p>À compléter : {profileMiss.join(", ")}. Rendez-vous dans <a href="/profil" className="underline font-medium">Profil & infos</a>.</p></div>
        </MotionDiv>
      )}

      <MotionDiv variants={stagger} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <MotionDiv key={c.label} variants={fadeUp}>
            <Card className="border-slate-200 hover:border-[#3D9597]/30 transition-colors">
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{loading ? "…" : c.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center">{c.icon}</div>
              </CardContent>
            </Card>
          </MotionDiv>
        ))}
      </MotionDiv>

      <MotionDiv variants={fadeUp}>
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Actions rapides</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[{ href: "/personnel", label: "Gérer le personnel" }, { href: "/patients", label: "Patients" }, { href: "/analyses", label: "Analyses" }, { href: "/profil", label: "Compléter le profil" }].map(a => (
              <a key={a.href} href={a.href} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-[#3D9597]/50 hover:bg-[#07122E]/5 transition-colors">{a.label}</a>
            ))}
          </CardContent>
        </Card>
      </MotionDiv>
      {loading && <p className="text-xs text-slate-400">Chargement des données… (l’interface reste disponible)</p>}
    </MotionDiv>
  );
}

