"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  StatCard,
  Alert,
  AlertDescription,
} from "@/components/ui";
import {
  User,
  Clock,
  FileText,
  FlaskConical,
  ClipboardCheck,
  Activity,
  ChevronRight,
} from "lucide-react";
import { VisitFormDialog } from "@/components/forms/visit-form-dialog";

type Visit = {
  id: string;
  matricule: string;
  visit_date: string;
  status: string;
  reason: string | null;
  order_items?: any[];
  specimens?: any[];
  results?: any[];
};

type Patient = {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

type Carnet = {
  id: string;
  matricule: string;
  visit_count: number;
  patient: Patient;
  visits: Visit[];
};

export default function PatientCarnetPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const router = useRouter();
  const { user, hasRole } = useAuth();

  const [carnet, setCarnet] = React.useState<Carnet | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [visitOpen, setVisitOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await api.get<Carnet>(`/patient-carnets/patient/${patientId}`);
      setCarnet(res.data ?? null);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement du carnet");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => { void load(); }, [load]);

  const canManage =
    hasRole("admin") || hasRole("super_admin") || hasRole("lab_manager") ||
    hasRole("receptionist") || hasRole("laborant") || hasRole("technician") || hasRole("doctor");

  const statusColor = (status: string) => {
    switch (status) {
      case "Validé":
        return "bg-success/10 text-success border-success/20";
      case "En vérification":
        return "bg-warning/10 text-warning border-warning/20";
      case "En cours":
        return "bg-info/10 text-info border-info/20";
      case "En attente":
        return "bg-muted text-muted-foreground border-border";
      case "À reprendre":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Chargement du carnet…</p>
      </div>
    );
  }

  if (error || !carnet) {
    return (
      <div className="space-y-6">
        <PageHeader title="Carnet du patient" description="Historique des visites et examens" />
        <Alert variant="destructive">
          <AlertDescription>{error || "Carnet introuvable"}</AlertDescription>
        </Alert>
        {canManage && (
          <Button onClick={() => router.push("/patients")}>
            Retour aux patients
          </Button>
        )}
      </div>
    );
  }

  const { patient, visits } = carnet;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnet du patient"
        description={`Historique complet des visites — ${patient.first_name} ${patient.last_name}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href={`/patients/dossiers/${patient.id}`}>
                <User className="h-4 w-4 mr-2" /> Fiche patient
              </a>
            </Button>
            {canManage && (
              <Link href="/patients/nouveau">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" /> Nouvelle visite
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Matricule"
          value={carnet.matricule}
          icon={<User className="h-5 w-5 text-alliya-turquoise-700" />}
          variant="alliya-turquoise"
        />
        <StatCard
          label="Visites"
          value={carnet.visit_count}
          icon={<Activity className="h-5 w-5 text-alliya-dark-700" />}
          variant="alliya-dark"
        />
        <StatCard
          label="Sexe"
          value={patient.gender}
          icon={<User className="h-5 w-5 text-muted-foreground" />}
          variant="outline"
        />
        <StatCard
          label="Téléphone"
          value={patient.phone || "—"}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          variant="outline"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du patient</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Nom complet</span>
            <span className="font-medium">{patient.first_name} {patient.last_name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Matricule</span>
            <span className="font-mono text-xs">{patient.matricule}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Date de naissance</span>
            <span>{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString("fr-FR") : "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Adresse</span>
            <span>{patient.address || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Email</span>
            <span>{patient.email || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Groupe / état civil</span>
            <span className="capitalize">{patient.gender}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Historique des visites ({visits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune visite enregistrée.</p>
              {canManage && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setVisitOpen(true)}
                >
                  Créer une première visite
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground">Visite</th>
                    <th className="text-left px-4 py-3 text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 text-muted-foreground">Motif</th>
                    <th className="text-left px-4 py-3 text-muted-foreground">Statut</th>
                    <th className="text-right px-4 py-3 text-muted-foreground">Examens</th>
                    <th className="text-right px-4 py-3 text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{v.matricule}</td>
                      <td className="px-4 py-3">
                        {new Date(v.visit_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">{v.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={statusColor(v.status)}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="text-right px-4 py-3">
                        {v.order_items?.length || 0}
                      </td>
                      <td className="text-right px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/patients/dossiers/${patient.id}/visites/${v.id}`);
                          }}
                        >
                          Voir <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <VisitFormDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        laboratoryId={user?.laboratory_id}
        patientId={carnet?.patient?.id}
        onCreated={() => { void load(); }}
      />
    </div>
  );
}
