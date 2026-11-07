"use client";

import * as React from "react";
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
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord laboratoire"
        description={`Laboratoire : ${labLabel}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patients"
          value={loading ? "…" : stats.patients}
          icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
          variant="alliya-turquoise"
        />
        <StatCard
          label="Analyses"
          value={loading ? "…" : stats.analyses}
          icon={<FlaskConical className="h-5 w-5 text-alliya-dark-700" />}
          variant="alliya-dark"
        />
        <StatCard
          label="En attente"
          value={loading ? "…" : stats.pending}
          icon={<ClipboardCheck className="h-5 w-5 text-warning" />}
          variant="outline"
        />
        <StatCard
          label="Validés"
          value={loading ? "…" : stats.validated}
          icon={<ShieldCheck className="h-5 w-5 text-success" />}
          variant="outline"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Informations laboratoire</h3>
        <p className="text-muted-foreground">
          {activeLab?.name || "—"} ({activeLab?.code || "—"})
        </p>
        {isSuperAdmin && (
          <a href="/admin" className="border border-input rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Accéder au panneau super admin
          </a>
        )}
      </div>
    </div>
  );
}

