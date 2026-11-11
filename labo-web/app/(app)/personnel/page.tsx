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
import { Plus, AlertCircle } from "lucide-react";
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
  const [visibleCount, setVisibleCount] = React.useState(10);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.laboratory_id) { setStaff([]); setLoading(false); return; }
    setLoading(true);
    const res = await api.safeGet<any[]>(`/users?laboratory_id=${user.laboratory_id}`);
    setStaff(!res.error && Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setVisibleCount(10); }, [staff.length]);
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => c + 10);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [staff.length, visibleCount]);

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

  if (loading) return <div className="p-6 flex items-center justify-center text-muted-foreground">Chargement…</div>;

  const visible = staff.slice(0, visibleCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Personnel du laboratoire"
        description="Créez et gérez les utilisateurs de votre laboratoire et leurs rôles."
        action={<Button onClick={() => { setError(""); setForm({ ...emptyUser }); setOpen(true); }} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] shadow-sm w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Nouvel utilisateur</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter un utilisateur</DialogTitle></DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={submit} className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="first_name">Prénom</Label><Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="last_name">Nom</Label><Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="phone">Téléphone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optionnel" /></div>
            <div className="space-y-1">
              <Label htmlFor="role">Rôle</Label>
              <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="is_active">Actif</Label>
              <select id="is_active" value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="true">Oui</option><option value="false">Non</option>
              </select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] shadow-sm">{saving ? "Création…" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border border-[#E5E7EB]">
        <CardContent className="p-3 sm:pt-5 sm:p-6">
          {staff.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">Aucun utilisateur. Ajoutez les membres de votre équipe.</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2 text-muted-foreground">Nom</th><th className="text-left px-3 py-2 text-muted-foreground">Email</th><th className="text-left px-3 py-2 text-muted-foreground">Téléphone</th><th className="text-left px-3 py-2 text-muted-foreground">Rôles</th><th className="text-left px-3 py-2 text-muted-foreground">Matricule</th><th className="text-left px-3 py-2 text-muted-foreground">Statut</th><th className="text-left px-3 py-2 text-muted-foreground">Profil</th></tr></thead>
                  <tbody>
                    {visible.map((s) => {
                      const miss = missingUser(s);
                      return (
                        <tr key={s.id} className="border-t border-[#E5E7EB]">
                          <td className="px-3 py-2">{`${s.first_name || ""} ${s.last_name || ""}`.trim() || "—"}</td>
                          <td className="px-3 py-2">{s.email || "—"}</td>
                          <td className="px-3 py-2">{s.phone || "—"}</td>
                          <td className="px-3 py-2">{Array.isArray(s.roles) ? s.roles.join(", ") : "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{s.matricule || "—"}</td>
                          <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active !== false ? "bg-[#3D9597]/10 text-[#2E7A7C]" : "bg-red-50 text-red-700"}`}>{s.is_active !== false ? "Actif" : "Inactif"}</span></td>
                          <td className="px-3 py-2">{miss.length ? <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3 w-3" /> {miss.join(", ")}</span> : <span className="text-xs text-[#2E7A7C]">Complet</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden grid grid-cols-2 gap-2">
                {visible.map((s) => {
                  const miss = missingUser(s);
                  const name = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "—";
                  return (
                    <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{(Array.isArray(s.roles) ? s.roles[0] : "") || "—"}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{s.matricule || "—"}</p>
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.is_active !== false ? "bg-[#3D9597]/10 text-[#2E7A7C]" : "bg-slate-100 text-slate-600"}`}>{s.is_active !== false ? "Actif" : "Inactif"}</span>
                        {miss.length > 0 && <span className="text-[10px] text-amber-700">Incomplet</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {staff.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
