"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VisitesPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const visitsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any[]>(`/visits?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = visitsResult.loading;
  const error = visitsResult.error;
  const envelope = visitsResult.data as any;
  const visits: any[] = (envelope?.data || []).filter((v: any) =>
    `${v.patient?.first_name} ${v.patient?.last_name} ${v.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error.message || "Impossible de charger les visites"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Visites" description="Gestion des visites et rendez-vous patients" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total visites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "…" : visits.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planifiees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-alliya-dark-700">
              {loading ? "…" : visits.filter((v) => v.status === "scheduled").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terminees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {loading ? "…" : visits.filter((v) => v.status === "completed").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {loading ? "…" : visits.filter((v) => v.status === "in_progress").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Rechercher</Label>
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Patient, matricule..."
            className="w-64"
            disabled={loading}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status">Statut</Label>
          <Input
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Tous les statuts"
            className="w-48"
            disabled={loading}
          />
        </div>
        <Link href="/patients/nouveau">
          <Button variant="alliya-turquoise" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle visite
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonTableRow className="h-20" />
            ) : visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  Aucune visite trouvee.
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.matricule}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{visit.patient?.first_name} {visit.patient?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(visit.visit_date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <Badge variant={visit.status === "completed" ? "default" : visit.status === "scheduled" ? "outline" : "secondary"}>
                      {visit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{visit.reason || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link href="/patients/dossiers">
                      <Button variant="ghost" size="sm">Dossier</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
