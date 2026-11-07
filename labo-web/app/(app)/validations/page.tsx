"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, ClipboardCheck, User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ValidationsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const validationsResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const params = new URLSearchParams({
      laboratory_id: user.laboratory_id,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    return api.safeGet<any[]>(`/result-validations?${params.toString()}`);
  }, { enabled: !!user?.laboratory_id });

  const loading = validationsResult.loading;
  const error = validationsResult.error;
  const envelope = validationsResult.data as any;
  const validations: any[] = (envelope?.data || []).filter((v: any) => {
    const patient = v.result?.patient || {};
    return `${patient.first_name} ${patient.last_name} ${v.result?.matricule}`.toLowerCase().includes(search.toLowerCase());
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error.message || "Impossible de charger les validations"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Validations" description="Validation et verification des resultats d analyses" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total validations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "…" : validations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {loading ? "…" : validations.filter((v) => v.status === "validated").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {loading ? "…" : validations.filter((v) => v.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rejetees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {loading ? "…" : validations.filter((v) => v.status === "rejected").length}
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
            placeholder="Patient, resultat..."
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
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resultat</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Statut validation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonTableRow className="h-20" />
            ) : validations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  Aucune validation trouvee.
                </TableCell>
              </TableRow>
            ) : (
              validations.map((validation) => {
                const result = validation.result || {};
                const patient = result.patient || {};
                return (
                  <TableRow key={validation.id}>
                    <TableCell className="font-medium">{result.matricule || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{patient.first_name} {patient.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{result.test_catalog?.name || "—"}</TableCell>
                    <TableCell>{result.value || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={validation.status === "validated" ? "default" : validation.status === "pending" ? "warning" : "secondary"}>
                        {validation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/patients/dossiers">
                        <Button variant="ghost" size="sm">Dossier</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
