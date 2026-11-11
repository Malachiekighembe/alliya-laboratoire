"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Plus, Building2, AlertCircle, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


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
  const [visibleLabs, setVisibleLabs] = React.useState(10);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

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
  React.useEffect(() => { setVisibleLabs(10); }, [labs.length]);
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleLabs((c) => c + 10);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [labs.length, visibleLabs]);

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
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Administration — Utilisateurs"
        description="Créer et gérer les utilisateurs des laboratoires."
        action={
          <Button onClick={() => { setError(""); setForm({ ...emptyUser }); setOpen(true); }} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] shadow-sm border-0 w-full sm:w-auto">
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
          <form onSubmit={submit} className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="laboratory_id">Laboratoire</Label>
              <select id="laboratory_id" value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/15">
                <option value="">— Aucun / à affecter plus tard —</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name || l.code} ({l.code})</option>)}
              </select>
            </div>
            <div><Label htmlFor="first_name">Prénom</Label><Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><Label htmlFor="last_name">Nom</Label><Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="phone">Téléphone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optionnel" /></div>
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

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border border-[#E5E7EB]"><CardContent className="p-3 sm:pt-5 sm:px-6"><p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Utilisateurs</p><p className="text-base sm:text-2xl font-bold">{totalUsers}</p></CardContent></Card>
        <Card className="border border-[#E5E7EB]"><CardContent className="p-3 sm:pt-5 sm:px-6"><p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Laboratoires</p><p className="text-base sm:text-2xl font-bold">{labs.length}</p></CardContent></Card>
        <Card className="border border-[#E5E7EB]"><CardContent className="p-3 sm:pt-5 sm:px-6"><p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Incomplets</p><p className="text-base sm:text-2xl font-bold text-amber-600">{Object.values(usersByLab).flat().filter(u => missingUser(u).length > 0).length}</p></CardContent></Card>
      </div>

      {loading ? <p className="text-muted-foreground p-2">Chargement…</p> : (
        <div className="space-y-3 sm:space-y-4">
          {labs.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun laboratoire. Créez d'abord un laboratoire et son responsable.</CardContent></Card>}
          {labs.slice(0, visibleLabs).map((lab) => {
            const users = usersByLab[lab.id] || [];
            return (
              <Card key={lab.id} className="border border-[#E5E7EB]">
                <CardContent className="p-3 sm:pt-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0"><Building2 className="h-4 w-4 text-[#07122E] shrink-0" /><span className="font-semibold text-sm sm:text-base truncate">{lab.name || lab.code}</span><span className="text-xs text-muted-foreground shrink-0">({users.length})</span></div>
                    <Button size="sm" variant="outline" onClick={() => { setError(""); setForm({ ...emptyUser, laboratory_id: lab.id }); setOpen(true); }} className="shrink-0"><UserCog className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">Ajouter</span></Button>
                  </div>
                  {users.length === 0 ? <p className="text-sm text-muted-foreground">Aucun utilisateur — assignez un responsable (admin).</p> : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2 text-muted-foreground">Nom</th><th className="text-left px-3 py-2 text-muted-foreground">Email</th><th className="text-left px-3 py-2 text-muted-foreground">Matricule</th><th className="text-left px-3 py-2 text-muted-foreground">Rôles</th><th className="text-left px-3 py-2 text-muted-foreground">Statut</th><th className="text-left px-3 py-2 text-muted-foreground">Profil</th></tr></thead>
                          <tbody>
                            {users.map((u: any) => {
                              const miss = missingUser(u);
                              return (
                                <tr key={u.id} className="border-t border-[#E5E7EB]">
                                  <td className="px-3 py-2">{`${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}</td>
                                  <td className="px-3 py-2">{u.email || "—"}</td>
                                  <td className="px-3 py-2 font-mono text-xs">{u.matricule || "—"}</td>
                                  <td className="px-3 py-2">{Array.isArray(u.roles) ? u.roles.join(", ") : "—"}</td>
                                  <td className="px-3 py-2"><span className={`text-xs px-2.5 py-1 rounded-full ${u.is_active !== false ? "bg-[#3D9597]/10 text-[#2E7A7C] border border-[#3D9597]/20" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{u.is_active !== false ? "Actif" : "Inactif"}</span></td>
                                  <td className="px-3 py-2">{miss.length ? <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3 w-3" /> {miss.join(", ")}</span> : <span className="text-xs text-[#2E7A7C]">Complet</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden grid grid-cols-2 gap-2">
                        {users.map((u: any) => {
                          const miss = missingUser(u);
                          const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
                          return (
                            <div key={u.id} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{u.matricule || "—"}</p>
                              <p className="text-[11px] text-slate-500 truncate">{(Array.isArray(u.roles) ? u.roles[0] : "") || "—"}</p>
                              <div className="flex items-center justify-between gap-1 pt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.is_active !== false ? "bg-[#3D9597]/10 text-[#2E7A7C]" : "bg-slate-100 text-slate-600"}`}>{u.is_active !== false ? "Actif" : "Inactif"}</span>
                                {miss.length > 0 && <span className="text-[10px] text-amber-700">Incomplet</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {labs.length > visibleLabs && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
        </div>
      )}
    </motion.div>
  );
}

