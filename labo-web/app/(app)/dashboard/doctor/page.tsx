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
} from "@/components/ui";
import { Users, FlaskConical, ClipboardCheck, Stethoscope } from "lucide-react";

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
    <div className="space-y-6">
      <PageHeader
        title="Espace médecin"
        description="Gestion des patients et validation des résultats"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mes patients"
          value={loading ? "…" : stats.patients}
          icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
          variant="alliya-turquoise"
        />
        <StatCard
          label="Analyses à traiter"
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
          icon={<Stethoscope className="h-5 w-5 text-success" />}
          variant="outline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulter la liste des patients assignés.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résultats à valider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.pending} résultat(s) en attente de validation.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analyses prescrites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Suivre les analyses en cours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

