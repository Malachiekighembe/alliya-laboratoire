"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton, SkeletonText, SkeletonTableRow } from "@/components/ui/skeleton";

export default function PatientsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");

  // Chargement non bloquant via useAsync (l'UI ne se fige pas)
  const { data: patients = [], loading, error } = useAsync(async () => {
    if (!user?.laboratory_id) return [];
    const res = await api.safeGet<any[]>(
      `/patients?laboratory_id=${user.laboratory_id}`
    );
    if (res.error) throw res.error;
    return Array.isArray(res.data) ? res.data : [];
  }, { enabled: !!user?.laboratory_id });

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error.message || "Impossible de charger les patients"}</AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Patients"
        description="Gestion des dossiers patients de votre laboratoire"
        action={
          <Link href="/patients/nouveau">
            <Button variant="alliya-turquoise" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Nouveau patient
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un patient…"
          className="w-full md:w-80"
          disabled={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Liste des patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-muted-foreground">Matricule</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Nom</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Prénom</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Téléphone</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SkeletonTableRow />
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center py-8">
                      Aucun patient trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{p.matricule}</TableCell>
                      <TableCell className="font-medium">{p.last_name}</TableCell>
                      <TableCell className="font-medium">{p.first_name}</TableCell>
                      <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            p.is_active
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                          )}
                        >
                          {p.is_active ? "Actif" : "Inactif"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
