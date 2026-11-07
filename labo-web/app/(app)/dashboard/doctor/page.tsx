"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLab } from "@/components/lab/LabProvider";
import { api } from "@/lib/api-client";
import {
  StatCard,
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Users, FlaskConical, ClipboardCheck, Stethoscope } from "lucide-react";

const MotionDiv = motion.div;
const MotionCard = motion.div;

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const staggerContainer: any = {
  hidden: {},
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const staggerItem: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function DoctorDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    patients: 0,
    analyses: 0,
    pending: 0,
    validated: 0,
  });

  React.useEffect(() => {
    if (!activeLabId) {
      setLoading(false);
      return;
    }
    const filter = `?laboratory_id=${activeLabId}`;
    api.get<any[]>(`/patients${filter}`).then((res) => {
      const patients =
    res.success
      ? (Array.isArray(res.data) ? res.data : [])
      : [];
      setStats((s) => ({ ...s, patients: patients.length }));
    });
    api.get<any[]>(`/resultats${filter}`).then((res) => {
      const results =
    res.success
      ? (Array.isArray(res.data) ? res.data : [])
      : [];
      setStats((s) => ({
        ...s,
        analyses: results.length,
        pending: results.filter(
          (x) => x.status === "pending" || x.status === "en_attente"
        ).length,
        validated: results.filter(
          (x) => x.status === "validated" || x.status === "valide"
        ).length,
      }));
      setLoading(false);
    });
  }, [activeLabId]);

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-2">
        <PageHeader
          title="Espace médecin"
          description="Gestion des patients et validation des résultats"
        />
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Mes patients"
            value={loading ? "…" : stats.patients}
            icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
            variant="alliya-turquoise"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Analyses à traiter"
            value={loading ? "…" : stats.analyses}
            icon={<FlaskConical className="h-5 w-5 text-alliya-dark-700" />}
            variant="alliya-dark"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="En attente"
            value={loading ? "…" : stats.pending}
            icon={<ClipboardCheck className="h-5 w-5 text-warning" />}
            variant="outline"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Validés"
            value={loading ? "…" : stats.validated}
            icon={<Stethoscope className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6 lg:grid-cols-3">
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Mes patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulter la liste des patients assignés.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Résultats à valider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.pending} résultat(s) en attente de validation.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Analyses prescrites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Suivre les analyses en cours.
            </p>
          </CardContent>
        </MotionCard>
      </MotionDiv>
    </MotionDiv>
  );
}
