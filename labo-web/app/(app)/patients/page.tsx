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
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const initialForm = {
  first_name: "",
  last_name: "",
  birth_date: "",
  gender: "UNKNOWN",
  phone: "",
  email: "",
  address: "",
  ssn: "",
};

export default function PatientsPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...initialForm });
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const carnetResult = useAsync(async () => {
    if (!user?.laboratory_id) return { data: null, error: null, loading: false };
    const res = await api.safeGet<any[]>(`/patients?laboratory_id=${user.laboratory_id}`);
    return res;
  }, { enabled: !!user?.laboratory_id });

  const patients: any[] = carnetResult.data ?? [];
  const loading = carnetResult.loading;
  const error = carnetResult.error;

  const filtered = patients.filter((p) =>
    `${p.first_name || ""} ${p.last_name || ""} ${p.matricule || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      // Champs alignés sur la table patients (matricule/laboratory_id gérés côté backend)
      await api.post("/patients", {
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date || null,
        gender: form.gender || "UNKNOWN",
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        ssn: form.ssn || null,
      });
      setOpen(false);
      setForm({ ...initialForm });
      await carnetResult.refetch();
    } catch (err: any) {
      setFormError(err?.message || "Erreur lors de la création du patient");
    } finally {
      setSaving(false);
    }
  };

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
          <Button variant="alliya-turquoise" size="sm" onClick={() => { setFormError(""); setForm({ ...initialForm }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau patient
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau patient</DialogTitle>
          </DialogHeader>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="first_name">Prénom (first_name) *</Label>
              <Input id="first_name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name">Nom (last_name) *</Label>
              <Input id="last_name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birth_date">Date de naissance (birth_date)</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Genre (gender)</Label>
              <select id="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Téléphone (phone)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email (email)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="address">Adresse (address)</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="ssn">N° sécurité sociale (ssn)</Label>
              <Input id="ssn" value={form.ssn} onChange={(e) => setForm({ ...form, ssn: e.target.value })} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" variant="alliya-turquoise" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", p.is_active ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100")}>
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
