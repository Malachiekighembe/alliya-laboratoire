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
import { Users, Calendar, Phone, Mail } from "lucide-react";

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
    <div className="space-y-6">
      <PageHeader
        title="Accueil - Réception"
        description="Gestion des patients et rendez-vous"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patients inscrits"
          value={loading ? "…" : stats.patients}
          icon={<Users className="h-5 w-5 text-alliya-turquoise-700" />}
          variant="alliya-turquoise"
        />
        <StatCard
          label="Rendez-vous"
          value={loading ? "…" : stats.appointments}
          icon={<Calendar className="h-5 w-5 text-alliya-dark-700" />}
          variant="alliya-dark"
        />
        <StatCard
          label="Aujourd'hui"
          value={loading ? "…" : stats.today}
          icon={<Phone className="h-5 w-5 text-warning" />}
          variant="outline"
        />
        <StatCard
          label="Contacts"
          value="—"
          icon={<Mail className="h-5 w-5 text-success" />}
          variant="outline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau patient</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enregistrer un nouveau patient.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendez-vous du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulter les rendez-vous planifiés.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recherche patient</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rechercher un patient existant.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

