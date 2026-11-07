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
import { Users, Calendar, Phone, Mail } from "lucide-react";

const MotionDiv = motion.div;
const MotionCard = motion.div;

const fadeUp: React.ComponentProps<typeof MotionDiv>["variants"] = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: any = {
  hidden: {},
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ReceptionistDashboard() {
  const { activeLabId } = useLab();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    patients: 0,
    appointments: 0,
    today: 0,
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
      setLoading(false);
    });
  }, [activeLabId]);

  return (
    <MotionDiv
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <MotionDiv
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-2"
      >
        <PageHeader
          title="Accueil - Réception"
          description="Gestion des patients et rendez-vous"
        />
      </MotionDiv>

      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MotionDiv
          variants={staggerItem}
          className="p-4"
        >
          <StatCard
            label="Patients inscrits"
            value={loading ? "…" : stats.patients}
            icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
            variant="alliya-turquoise"
          />
        </MotionDiv>
        <MotionDiv
          variants={staggerItem}
          className="p-4"
        >
          <StatCard
            label="Rendez-vous"
            value={loading ? "…" : stats.appointments}
            icon={<Calendar className="h-5 w-5 text-alliya-dark-700" />}
            variant="alliya-dark"
          />
        </MotionDiv>
        <MotionDiv
          variants={staggerItem}
          className="p-4"
        >
          <StatCard
            label="Aujourd'hui"
            value={loading ? "…" : stats.today}
            icon={<Phone className="h-5 w-5 text-warning" />}
            variant="outline"
          />
        </MotionDiv>
        <MotionDiv
          variants={staggerItem}
          className="p-4"
        >
          <StatCard
            label="Contacts"
            value="—"
            icon={<Mail className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-6 lg:grid-cols-3"
      >
        <MotionCard
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-base">Nouveau patient</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enregistrer un nouveau patient.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-base">Rendez-vous du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulter les rendez-vous planifiés.
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-base">Recherche patient</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rechercher un patient existant.
            </p>
          </CardContent>
        </MotionCard>
      </MotionDiv>
    </MotionDiv>
  );
}
