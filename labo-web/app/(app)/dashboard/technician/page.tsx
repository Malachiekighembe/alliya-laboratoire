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
import { FlaskConical, Users, Microscope, ClipboardList } from "lucide-react";

export default function TechnicianDashboard() {
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
    <div className="space-y-6">
      <PageHeader
        title="Espace technicien"
        description="Gestion des analyses et échantillons"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Analyses du jour"
          value={loading ? "…" : stats.analyses}
          icon={<FlaskConical className="h-5 w-5 text-alliya-turquoise-700" />}
          variant="alliya-turquoise"
        />
        <StatCard
          label="Échantillons"
          value={loading ? "…" : stats.specimens}
          icon={<Microscope className="h-5 w-5 text-alliya-dark-700" />}
          variant="alliya-dark"
        />
        <StatCard
          label="En attente"
          value={loading ? "…" : stats.pending}
          icon={<ClipboardList className="h-5 w-5 text-warning" />}
          variant="outline"
        />
        <StatCard
          label="Terminés"
          value={loading ? "…" : stats.completed}
          icon={<Users className="h-5 w-5 text-success" />}
          variant="outline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouvelles analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulter les analyses à réaliser.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Échantillons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gérer la réception des échantillons.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saisir résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Entrer les résultats d'analyses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

