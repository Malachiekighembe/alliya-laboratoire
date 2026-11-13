"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api, toList } from "@/lib/api-client";
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
  FilePlus2,
  Printer,
  Trash2,
} from "lucide-react";
import { VisitFormDialog } from "@/components/forms/visit-form-dialog";
import { PatientDocumentFormDialog } from "@/components/forms/patient-document-form-dialog";

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

type PatientDocument = {
  id: string;
  title: string;
  reference: string | null;
  document_type: string;
  printed_at: string | null;
  created_at: string;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  bon_examen: "Bon d'examen",
  ordonnance: "Ordonnance",
  compte_rendu: "Compte rendu",
  facture: "Facture",
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
  const [documents, setDocuments] = React.useState<PatientDocument[]>([]);
  const [documentsOpen, setDocumentsOpen] = React.useState(false);
  const [documentsError, setDocumentsError] = React.useState<string | null>(null);

  const loadDocuments = React.useCallback(async () => {
    if (!patientId) return;
    try {
      const query = `/patient-documents?patient_id=${patientId}&limit=50${user?.laboratory_id ? `&laboratory_id=${user.laboratory_id}` : ""}`;
      const res = await api.get<any>(query);
      setDocuments(toList(res.data));
      setDocumentsError(null);
    } catch (err: any) {
      setDocumentsError(err?.message || "Documents indisponibles");
    }
  }, [patientId, user?.laboratory_id]);

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
  React.useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  const removeDocument = async (document: PatientDocument) => {
    if (!window.confirm(`Supprimer « ${document.title} » ?`)) return;
    try {
      await api.delete(`/patient-documents/${document.id}`);
      await loadDocuments();
    } catch (err: any) {
      setDocumentsError(err?.message || "Suppression impossible");
    }
  };

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
          variant="default"
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

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents du patient ({documents.length})
          </CardTitle>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setDocumentsOpen(true)}>
              <FilePlus2 className="h-4 w-4 mr-2" /> Nouveau document
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {documentsError ? (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{documentsError}</AlertDescription>
            </Alert>
          ) : null}
          {documents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun document généré pour ce patient.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((document) => (
                <li key={document.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{document.title}</span>
                      <Badge variant="secondary">
                        {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                      </Badge>
                      {document.printed_at ? (
                        <Badge variant="outline" className="text-[10px]">
                          imprimé le {new Date(document.printed_at).toLocaleDateString("fr-FR")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{document.reference || "—"}</span>
                      {" · "}
                      {new Date(document.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/patients/carnet/${patient.id}/documents/${document.id}`}>
                        <Printer className="h-4 w-4 mr-2" /> Ouvrir / imprimer
                      </Link>
                    </Button>
                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Supprimer le document"
                        onClick={() => void removeDocument(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PatientDocumentFormDialog
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        patientId={patient.id}
        laboratoryId={user?.laboratory_id}
        onCreated={() => { void loadDocuments(); }}
      />

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
