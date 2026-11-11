"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Plus, Users, Building2, AlertCircle, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const ROLES = ["admin","lab_manager","doctor","technician","receptionist","laborant","viewer"];
const emptyUser = { laboratory_id: "", first_name: "", last_name: "", email: "", phone: "", password: "", role: "admin", is_active: true };

function missingUser(u: any) {
  const m: string[] = [];
  if (!u?.first_name) m.push("prénom");
  if (!u?.last_name) m.push("nom");
  if (!u?.email) m.push("email");
  if (!u?.phone) m.push("téléphone");
  return m;
}

export default function AdminUtilisateursPage() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [usersByLab, setUsersByLab] = React.useState<Record<string, any[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...emptyUser });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.safeGet<any[]>("/laboratories");
      const labList = !res.error && Array.isArray(res.data) ? res.data : [];
      setLabs(labList);
      const entries = await Promise.all(
        labList.map(async (lab) => {
          const u = await api.safeGet<any[]>(`/users?laboratory_id=${lab.id}`);
          return [lab.id, !u.error && Array.isArray(u.data) ? u.data : []] as [string, any[]];
        })
      );
      setUsersByLab(Object.fromEntries(entries));
    } catch { setLabs([]); setUsersByLab({}); } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await api.post("/users", {
        laboratory_id: form.laboratory_id || null,
        first_name: form.first_name || "",
        last_name: form.last_name || "",
        email: form.email || null,
        phone: form.phone || null,
        password: form.password || undefined,
        roles: [form.role || "viewer"],
        is_active: form.is_active,
      });
      setOpen(false); setForm({ ...emptyUser });
      await load();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally { setSaving(false); }
  };

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  const totalUsers = Object.values(usersByLab).reduce((s, a) => s + a.length, 0);

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Administration — Utilisateurs"
        description="Créer et gérer les responsables/admins et utilisateurs des laboratoires. La création n'est pas bloquée : complétez les profils ensuite."
        action={
          <Button onClick={() => { setError(""); setForm({ ...emptyUser }); setOpen(true); }} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] shadow-sm border-0">
            <Plus className="h-4 w-4 mr-2" /> Nouvel utilisateur
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="laboratory_id">Laboratoire</Label>
              <select id="laboratory_id" value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/15">
                <option value="">— Aucun / à affecter plus tard —</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name || l.code} ({l.code})</option>)}
              </select>
            </div>
            <div><Label htmlFor="first_name">Prénom</Label><Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Prénom" /></div>
            <div><Label htmlFor="last_name">Nom</Label><Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Nom" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" /></div>
            <div><Label htmlFor="phone">Téléphone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+243 ..." /></div>
            <div><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optionnel, à définir plus tard" /></div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/15">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="is_active">Statut</Label>
              <select id="is_active" value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/15">
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] shadow-sm border-0">{saving ? "Création…" : "Créer l'utilisateur"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-[#E5E7EB]"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Utilisateurs</p><p className="text-2xl font-bold">{totalUsers}</p></CardContent></Card>
        <Card className="border border-[#E5E7EB]"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Laboratoires</p><p className="text-2xl font-bold">{labs.length}</p></CardContent></Card>
        <Card className="border border-[#E5E7EB]"><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Profils incomplets</p><p className="text-2xl font-bold text-amber-600">{Object.values(usersByLab).flat().filter(u => missingUser(u).length > 0).length}</p></CardContent></Card>
      </div>

      {loading ? <p className="text-muted-foreground">Chargement…</p> : (
        <div className="space-y-4">
          {labs.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun laboratoire. Créez d&apos;abord un laboratoire et son responsable.</CardContent></Card>}
          {labs.map((lab) => {
            const users = usersByLab[lab.id] || [];
            return (
              <Card key={lab.id} className="border border-[#E5E7EB]">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#07122E]" /><span className="font-semibold">{lab.name || lab.code}</span><span className="text-xs text-muted-foreground">({users.length})</span></div>
                    <Button size="sm" variant="outline" onClick={() => { setError(""); setForm({ ...emptyUser, laboratory_id: lab.id }); setOpen(true); }}><UserCog className="h-3.5 w-3.5 mr-1" /> Ajouter</Button>
                  </div>
                  {users.length === 0 ? <p className="text-sm text-muted-foreground">Aucun utilisateur — assignez un responsable (admin).</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2 text-muted-foreground">Nom</th><th className="text-left px-3 py-2 text-muted-foreground">Email</th><th className="text-left px-3 py-2 text-muted-foreground">Rôles</th><th className="text-left px-3 py-2 text-muted-foreground">Statut</th><th className="text-left px-3 py-2 text-muted-foreground">Profil</th></tr></thead>
                        <tbody>
                          {users.map((u: any) => {
                            const miss = missingUser(u);
                            return (
                              <tr key={u.id} className="border-t border-[#E5E7EB]">
                                <td className="px-3 py-2">{(u.first_name || "") + " " + (u.last_name || "") || "—"}</td>
                                <td className="px-3 py-2">{u.email || "—"}</td>
                                <td className="px-3 py-2">{Array.isArray(u.roles) ? u.roles.join(", ") : "—"}</td>
                                <td className="px-3 py-2"><span className={`text-xs px-2.5 py-1 rounded-full ${u.is_active !== false ? "bg-[#3D9597]/10 text-[#2E7A7C] border border-[#3D9597]/20" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{u.is_active !== false ? "Actif" : "Inactif"}</span></td>
                                <td className="px-3 py-2">{miss.length ? <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3 w-3" /> {miss.join(", ")}</span> : <span className="text-xs text-[#2E7A7C]">Complet</span>}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </MotionDiv>
  );
}





