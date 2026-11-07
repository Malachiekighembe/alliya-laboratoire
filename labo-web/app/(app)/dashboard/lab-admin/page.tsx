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
  Button,
} from "@/components/ui";
import { Users, FlaskConical, ClipboardCheck, ShieldCheck } from "lucide-react";

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

export default function LabAdminDashboard() {
  const { user, activeLabId, activeLab, isSuperAdmin } = useLab();
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
    Promise.allSettled([
      api.get<any[]>(`/patients${filter}`),
      api.get<any[]>(`/results${filter}`),
    ]).then(([p, r]) => {
      const patients =
        p.status === "fulfilled"
          ? (Array.isArray(p.value.data) ? p.value.data : [])
          : [];
      const results =
        r.status === "fulfilled"
          ? (Array.isArray(r.value.data) ? r.value.data : [])
          : [];
      setStats({
        patients: patients.length,
        analyses: results.length,
        pending: results.filter(
          (x) => x.status === "pending" || x.status === "en_attente"
        ).length,
        validated: results.filter(
          (x) => x.status === "validated" || x.status === "valide"
        ).length,
      });
      setLoading(false);
    });
  }, [activeLabId]);

  const labLabel = activeLab?.name || "Laboratoire";

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-2">
        <PageHeader
          title="Tableau de bord laboratoire"
          description={`Laboratoire : ${labLabel}`}
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
            icon={<ShieldCheck className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Informations laboratoire</h3>
        <p className="text-muted-foreground">
          {activeLab?.name || "—"} ({activeLab?.code || "—"})
        </p>
        {isSuperAdmin && (
          <a href="/admin" className="border border-input rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Accéder au panneau super admin
          </a>
        )}
      </MotionCard>
    </MotionDiv>
  );
}
