"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ROLES = ["admin","lab_manager","doctor","technician","receptionist","laborant","viewer"];
const emptyUser = { first_name: "", last_name: "", email: "", phone: "", password: "", role: "viewer", is_active: true };

function missingUser(u: any) {
  const m: string[] = [];
  if (!u?.first_name) m.push("prénom");
  if (!u?.last_name) m.push("nom");
  if (!u?.email) m.push("email");
  if (!u?.phone) m.push("téléphone");
  return m;
}

export default function PersonnelPage() {
  const { user } = useAuth();
  useRoleGuard();
  const [staff, setStaff] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...emptyUser });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user?.laboratory_id) { setStaff([]); setLoading(false); return; }
    setLoading(true);
    const res = await api.safeGet<any[]>(`/users?laboratory_id=${user.laboratory_id}`);
    setStaff(!res.error && Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await api.post("/users", {
        laboratory_id: user?.laboratory_id,
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel du laboratoire"
        description="Créez et gérez les utilisateurs de votre laboratoire et leurs rôles. Les informations manquantes peuvent être complétées plus tard."
        action={<Button onClick={() => { setError(""); setForm({ ...emptyUser }); setOpen(true); }} className="bg-[#0f766e] text-white hover:bg-[#115e59]"><Plus className="h-4 w-4 mr-2" /> Nouvel utilisateur</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter un utilisateur</DialogTitle></DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="first_name">Prénom (first_name)</Label><Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="last_name">Nom (last_name)</Label><Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="email">Email (email)</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="phone">Téléphone (phone)</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="password">Mot de passe (password)</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optionnel" /></div>
            <div className="space-y-1">
              <Label htmlFor="role">Rôle (roles[])</Label>
              <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="is_active">Actif (is_active)</Label>
              <select id="is_active" value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="true">Oui</option><option value="false">Non</option>
              </select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-[#0f766e] text-white hover:bg-[#115e59]">{saving ? "Création…" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border border-[#E5E7EB]">
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2 text-muted-foreground">Nom</th><th className="text-left px-3 py-2 text-muted-foreground">Email</th><th className="text-left px-3 py-2 text-muted-foreground">Téléphone</th><th className="text-left px-3 py-2 text-muted-foreground">Rôles</th><th className="text-left px-3 py-2 text-muted-foreground">Statut</th><th className="text-left px-3 py-2 text-muted-foreground">Profil</th></tr></thead>
              <tbody>
                {staff.map((s) => {
                  const miss = missingUser(s);
                  return (
                    <tr key={s.id} className="border-t border-[#E5E7EB]">
                      <td className="px-3 py-2">{(s.first_name || "") + " " + (s.last_name || "") || "—"}</td>
                      <td className="px-3 py-2">{s.email || "—"}</td>
                      <td className="px-3 py-2">{s.phone || "—"}</td>
                      <td className="px-3 py-2">{Array.isArray(s.roles) ? s.roles.join(", ") : "—"}</td>
                      <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{s.is_active !== false ? "Actif" : "Inactif"}</span></td>
                      <td className="px-3 py-2">{miss.length ? <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3 w-3" /> {miss.join(", ")}</span> : <span className="text-xs text-green-700">Complet</span>}</td>
                    </tr>
                  );
                })}
                {staff.length === 0 && <tr><td colSpan={6} className="text-muted-foreground text-center py-6">Aucun utilisateur. Ajoutez les membres de votre équipe.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
