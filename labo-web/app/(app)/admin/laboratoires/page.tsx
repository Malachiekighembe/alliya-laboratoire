"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui";
import { Building2, Plus, Users, Activity, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const initialForm = {
  code: "",
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  is_active: true,
};

export default function AdminLaboratoiresPage() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...initialForm });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.safeGet<any[]>("/laboratories");
      setLabs(!res.error && Array.isArray(res.data) ? res.data : []);
    } catch {
      setLabs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Champs alignés sur la table laboratories (code,name,slug,email,phone,address,is_active)
      await api.post("/laboratories", {
        code: form.code,
        name: form.name,
        slug: form.slug,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        is_active: form.is_active,
      });
      setOpen(false);
      setForm({ ...initialForm });
      await load();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Laboratoires"
        description="Gestion des laboratoires du système"
        action={
          <Button onClick={() => { setError(""); setForm({ ...initialForm }); setOpen(true); }} className="bg-[#111827] text-white hover:bg-[#374151]">
            <Plus className="h-4 w-4 mr-2" /> Nouveau laboratoire
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un laboratoire</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LAB001" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du laboratoire" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="labo-centre" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="is_active">Actif</Label>
              <select id="is_active" value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-[#111827] text-white hover:bg-[#374151]">{saving ? "Création…" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {labs.map((lab) => (
            <Card key={lab.id} className="border border-[#E5E7EB]">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-[#111827] text-white flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{lab.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{lab.code}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${lab.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {lab.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {lab.stats?.users_count || 0} utilisateurs</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Activity className="h-3.5 w-3.5" /> {lab.stats?.patients_count || 0} patients</div>
                <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Plan: {lab.subscription?.plan || "—"} ({lab.subscription?.status || "—"})</div>
              </CardContent>
            </Card>
          ))}
          {labs.length === 0 && <p className="text-muted-foreground">Aucun laboratoire.</p>}
        </div>
      )}
    </MotionDiv>
  );
}
