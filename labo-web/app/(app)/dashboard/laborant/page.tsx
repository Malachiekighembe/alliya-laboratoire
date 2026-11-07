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
import { FlaskConical, Users, Activity, Eye } from "lucide-react";

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

export default function LaborantDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    analyses: 0,
    specimens: 0,
    pending: 0,
    completed: 0,
  });

  React.useEffect(() => {
    if (!activeLabId) {
      setLoading(false);
      return;
    }
    const filter = `?laboratory_id=${activeLabId}`;
    api.get<any[]>(`/analyses${filter}`).then((res) => {
      const analyses =
    res.success
      ? (Array.isArray(res.data) ? res.data : [])
      : [];
      setStats((s) => ({ ...s, analyses: analyses.length }));
      setLoading(false);
    });
  }, [activeLabId]);

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-2">
        <PageHeader
          title="Espace laborantin"
          description="Exécution des analyses de laboratoire"
        />
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Analyses à réaliser"
            value={loading ? "…" : stats.analyses}
            icon={<FlaskConical className="h-5 w-5 text-alliya-turquoise-700" />}
            variant="alliya-turquoise"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Échantillons"
            value={loading ? "…" : stats.specimens}
            icon={<Activity className="h-5 w-5 text-alliya-dark-700" />}
            variant="alliya-dark"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="En cours"
            value={loading ? "…" : stats.pending}
            icon={<Eye className="h-5 w-5 text-warning" />}
            variant="outline"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Terminés"
            value={loading ? "…" : stats.completed}
            icon={<Users className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6 lg:grid-cols-3">
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Analyses du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Liste des analyses à effectuer.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Saisie des résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Entrer les résultats obtenus.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Contrôle qualité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vérifier la conformité des analyses.
            </p>
          </CardContent>
        </MotionCard>
      </MotionDiv>
    </MotionDiv>
  );
}
