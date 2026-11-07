"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
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
import {
  Building2,
  ShieldCheck,
  DollarSign,
  Users,
  Activity,
  Clock,
} from "lucide-react";

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

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<any[]>("/laboratories")
      .then((res) => {
        setLabs(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalLabs = labs.length;
  const activeLabs = labs.filter((l) => l.is_active).length;
  const totalUsers = labs.reduce(
    (s, l) => s + (l.stats?.users_count || 0),
    0
  );
  const totalPatients = labs.reduce(
    (s, l) => s + (l.stats?.patients_count || 0),
    0
  );
  const monthlyRevenue = labs.reduce(
    (sum, l) =>
      l.subscription && l.subscription.status === "active"
        ? sum + l.subscription.price_monthly
        : sum,
    0
  );

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-2">
        <PageHeader
          title="Administration du réseau"
          description={`Connecté en tant que ${user?.first_name} ${user?.last_name} (Super Administrateur)`}
          action={
            <a href="/admin" className="bg-slate-800 hover:bg-slate-900 text-slate-100 rounded-md px-4 py-2 text-sm font-medium transition-colors">
              Panneau admin
            </a>
          }
        />
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Laboratoires"
            value={totalLabs}
            icon={<Building2 className="h-5 w-5 text-slate-600" />}
            variant="alliya-turquoise"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Actifs"
            value={activeLabs}
            icon={<ShieldCheck className="h-5 w-5 text-success" />}
            variant="outline"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Utilisateurs"
            value={totalUsers}
            icon={<Users className="h-5 w-5 text-slate-600" />}
            variant="alliya-dark"
          />
        </MotionDiv>
        <MotionDiv variants={staggerItem} className="p-4">
          <StatCard
            label="Revenu mensuel"
            value={new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(monthlyRevenue)}
            icon={<DollarSign className="h-5 w-5 text-slate-600" />}
            variant="alliya-dark"
          />
        </MotionDiv>
      </MotionDiv>

      <MotionDiv variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6 lg:grid-cols-2">
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Patients du réseau</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalPatients}</p>
              <p className="text-xs text-muted-foreground">
                Total inscrits
              </p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </MotionCard>
        <MotionCard variants={staggerItem} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Abonnements actifs</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{activeLabs}</p>
              <p className="text-xs text-muted-foreground">
                Laboratoires actifs
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </MotionCard>
      </MotionDiv>

      {loading ? (
        <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Chargement…</p>
        </MotionDiv>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground">Laboratoire</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 text-muted-foreground">Utilisateurs</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((l) => (
                <tr key={l.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                  <td className="px-4 py-3">{l.subscription?.plan || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        l.is_active
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {l.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    {l.stats?.users_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MotionDiv>
  );
}
