"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FlaskConical, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import Link from "next/link";

export default function PrelevementsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const specimensResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any[]>(`/specimens?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = specimensResult.loading;
  const error = specimensResult.error;
  const envelope = specimensResult.data as any;
  const specimens: any[] = (envelope?.data || []).filter((s: any) =>
    `${s.patient?.first_name} ${s.patient?.last_name} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error.message || "Impossible de charger les echantillons"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Prelevements" description="Gestion des echantillons biologiques" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total echantillons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "…" : specimens.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-alliya-dark-700">
              {loading ? "…" : specimens.filter((s) => s.status === "received").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {loading ? "…" : specimens.filter((s) => s.status === "processing").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Termines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {loading ? "…" : specimens.filter((s) => s.status === "completed").length}
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
            placeholder="Patient, matricule echantillon..."
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
            Nouveau prelevement
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date collecte</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonTableRow className="h-20" />
            ) : specimens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  Aucun echantillon trouve.
                </TableCell>
              </TableRow>
            ) : (
              specimens.map((specimen) => (
                <TableRow key={specimen.id}>
                  <TableCell className="font-medium">{specimen.matricule}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{specimen.patient?.first_name} {specimen.patient?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{specimen.type}</TableCell>
                  <TableCell>
                    <Badge variant={specimen.status === "completed" ? "default" : specimen.status === "processing" ? "warning" : "outline"}>
                      {specimen.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(specimen.collection_date).toLocaleDateString("fr-FR")}</TableCell>
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
