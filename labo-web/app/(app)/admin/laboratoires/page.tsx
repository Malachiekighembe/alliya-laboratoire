"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Building2, Plus, Users, Mail, Phone, MapPin, Shield, AlertCircle, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const emptyLab = { code: "", name: "", slug: "", email: "", phone: "", address: "", is_active: true };
const emptyAdmin = { first_name: "", last_name: "", email: "", phone: "", password: "" };

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function missingLab(l: any) {
  const miss: string[] = [];
  if (!l?.name) miss.push("nom");
  if (!l?.address) miss.push("adresse");
  if (!l?.phone) miss.push("téléphone");
  if (!l?.email) miss.push("email");
  return miss;
}

export default function AdminLaboratoiresPage() {
  const { user } = useAuth();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editLab, setEditLab] = React.useState<any | null>(null);
  const [labForm, setLabForm] = React.useState({ ...emptyLab });
  const [adminForm, setAdminForm] = React.useState({ ...emptyAdmin });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.safeGet<any[]>("/laboratories");
      setLabs(!res.error && Array.isArray(res.data) ? res.data : []);
    } catch { setLabs([]); } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setError(""); setEditLab(null);
    setLabForm({ ...emptyLab }); setAdminForm({ ...emptyAdmin });
    setOpen(true);
  };
  const openEdit = (lab: any) => {
    setError(""); setEditLab(lab);
    setLabForm({
      code: lab.code || "", name: lab.name || "", slug: lab.slug || "",
      email: lab.email || "", phone: lab.phone || "", address: lab.address || "",
      is_active: lab.is_active !== false,
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      if (editLab) {
        await api.patch(`/laboratories/${editLab.id}`, {
          code: labForm.code || undefined,
          name: labForm.name || undefined,
          slug: labForm.slug || undefined,
          email: labForm.email || null,
          phone: labForm.phone || null,
          address: labForm.address || null,
          is_active: labForm.is_active,
        });
      } else {
        // Création labo + responsable (admin) — champs non bloquants côté admin
        const payload: any = {
          name: labForm.name || "Nouveau laboratoire",
          code: labForm.code || undefined,
          slug: labForm.slug || (labForm.name ? slugify(labForm.name) : undefined),
          email: labForm.email || null,
          phone: labForm.phone || null,
          address: labForm.address || null,
          is_active: labForm.is_active,
        };
        const hasAdmin = adminForm.first_name || adminForm.last_name || adminForm.email || adminForm.password;
        if (hasAdmin) {
          payload.admin = {
            first_name: adminForm.first_name || "",
            last_name: adminForm.last_name || "",
            email: adminForm.email || null,
            phone: adminForm.phone || null,
            password: adminForm.password || undefined,
            roles: ["admin"],
            is_active: true,
          };
        }
        await api.post("/laboratories", payload);
      }
      setOpen(false); setEditLab(null);
      await load();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  };

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Administration — Laboratoires"
        description="Créer les laboratoires et leur responsable. Les informations manquantes pourront être complétées plus tard dans les profils."
        action={
          <Button onClick={openCreate} className="bg-[ #1d4ed8] text-white hover:bg-[#1e40af]">
            <Plus className="h-4 w-4 mr-2" /> Nouveau laboratoire
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLab ? "Modifier le laboratoire" : "Créer un laboratoire & son responsable"}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={submit} className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Building2 className="h-4 w-4" /> Informations du laboratoire <span className="text-xs font-normal text-slate-400">(table: laboratories)</span></h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="name">Nom du laboratoire</Label>
                  <Input id="name" value={labForm.name} onChange={(e) => { const v = e.target.value; setLabForm({ ...labForm, name: v, slug: editLab ? labForm.slug : (labForm.slug || slugify(v)) }); }} placeholder="Ex: Laboratoire Central" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" value={labForm.code} onChange={(e) => setLabForm({ ...labForm, code: e.target.value })} placeholder="Auto si vide (ex: LAB-001)" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={labForm.slug} onChange={(e) => setLabForm({ ...labForm, slug: e.target.value })} placeholder="labo-central" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lab_email">Email</Label>
                  <Input id="lab_email" type="email" value={labForm.email} onChange={(e) => setLabForm({ ...labForm, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lab_phone">Téléphone</Label>
                  <Input id="lab_phone" value={labForm.phone} onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={labForm.address} onChange={(e) => setLabForm({ ...labForm, address: e.target.value })} placeholder="Adresse complète" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="is_active">Statut (is_active)</Label>
                  <select id="is_active" value={labForm.is_active ? "true" : "false"} onChange={(e) => setLabForm({ ...labForm, is_active: e.target.value === "true" })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>
            </section>

            {!editLab && (
              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Shield className="h-4 w-4" /> Responsable du laboratoire <span className="text-xs font-normal text-slate-400">(table: users, rôle: admin)</span></h3>
                <p className="text-xs text-slate-500">Créez l&apos;administrateur du labo (il pourra ensuite créer ses utilisateurs). Vous pouvez laisser vide et compléter plus tard.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="a_first">Prénom (first_name)</Label>
                    <Input id="a_first" value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="a_last">Nom (last_name)</Label>
                    <Input id="a_last" value={adminForm.last_name} onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="a_email">Email (email)</Label>
                    <Input id="a_email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="a_phone">Téléphone (phone)</Label>
                    <Input id="a_phone" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="a_pass">Mot de passe (password)</Label>
                    <Input id="a_pass" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Définir maintenant ou plus tard" />
                  </div>
                  <div className="space-y-1">
                    <Label>Rôle</Label>
                    <div className="text-sm px-3 py-2 rounded-md border bg-slate-50 text-slate-700">admin (affecté automatiquement)</div>
                  </div>
                </div>
              </section>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-[ #1d4ed8] text-white hover:bg-[#1e40af]">{saving ? "Enregistrement…" : (editLab ? "Mettre à jour" : "Créer le laboratoire")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : labs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Aucun laboratoire. Créez le premier et assignez son responsable admin.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {labs.map((lab) => {
            const miss = missingLab(lab);
            return (
              <Card key={lab.id} className="border border-[#E5E7EB] hover:shadow-sm transition-shadow">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center shrink-0"><Building2 className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{lab.name || "(Sans nom)"}</p>
                        <p className="text-xs text-slate-500 font-mono">{lab.code || "—"} · {lab.slug || "—"}</p>
                      </div>
                    </div>
                    <button onClick={() => openEdit(lab)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Modifier"><Pencil className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{lab.address || <span className="text-amber-600">Adresse manquante</span>}</span></div>
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{lab.email || <span className="text-slate-400">Email non renseigné</span>}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /><span>{lab.phone || <span className="text-slate-400">Téléphone non renseigné</span>}</span></div>
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-400" /><span>{lab.stats?.users_count ?? 0} utilisateur(s)</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${lab.is_active ? "bg-[#3D9597]/10 text-[#2E7A7C] border border-[#3D9597]/20" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{lab.is_active ? "Actif" : "Inactif"}</span>
                    {miss.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" /> Profil incomplet ({miss.length})</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </MotionDiv>
  );
}



