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
import { Users, FlaskConical, ClipboardCheck, Eye } from "lucide-react";

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

export default function ViewerDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    patients: 0,
    analyses: 0,
    results: 0,
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
    api.get<any[]>(`/analyses${filter}`).then((res) => {
      const analyses =
    res.success
      ? (Array.isArray(res.data) ? res.data : [])
      : [];
      setStats((s) => ({ ...s, analyses: analyses.length }));
    });
    api.get<any[]>(`/resultats${filter}`).then((res) => {
      const results =
    res.success
      ? (Array.isArray(res.data) ? res.data : [])
      : [];
      setStats((s) => ({ ...s, results: results.length }));
      setLoading(false);
    });
  }, [activeLabId]);

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-2">
        <PageHeader
          title="Accès en lecture seule"
          description="Consultation des données du laboratoire"
        />
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Patients"
            value={loading ? "…" : stats.patients}
            icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
            variant="alliya-turquoise"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Analyses"
            value={loading ? "…" : stats.analyses}
            icon={<FlaskConical className="h-5 w-5 text-alliya-dark-700" />}
            variant="alliya-dark"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Résultats"
            value={loading ? "…" : stats.results}
            icon={<ClipboardCheck className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Mode lecture"
            value="—"
            icon={<Eye className="h-5 w-5 text-muted-foreground" />}
            variant="default"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionCard variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-lg border border-border bg-muted/50 p-6">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Vous disposez d'un accès en lecture seule. Certaines actions sont
            restreintes.
          </p>
        </div>
      </MotionCard>
    </MotionDiv>
  );
}
