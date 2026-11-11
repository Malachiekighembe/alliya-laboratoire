"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Plus, CreditCard, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

const PLANS: Record<string, { label: string; price: number; max_users: number; max_patients: number; max_analyses: number }> = {
  starter: { label: "Starter", price: 29, max_users: 3, max_patients: 200, max_analyses: 500 },
  professional: { label: "Professional", price: 79, max_users: 10, max_patients: 2000, max_analyses: 5000 },
  enterprise: { label: "Enterprise", price: 199, max_users: 50, max_patients: 20000, max_analyses: 50000 },
};

const emptyForm = {
  laboratory_id: "",
  plan: "starter",
  status: "active",
  started_at: "",
  expires_at: "",
  currency: "EUR",
  auto_renew: true,
};

export default function AdminAbonnementsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = React.useState<any[]>([]);
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...emptyForm });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Chargement non bloquant: l'UI reste interactive
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.safeGet<any[]>("/subscriptions"),
        api.safeGet<any[]>("/laboratories"),
      ]);
      setSubs(!s.error && Array.isArray(s.data) ? s.data : []);
      setLabs(!l.error && Array.isArray(l.data) ? l.data : []);
    } catch {
      // on garde les données existantes, pas de blocage
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const p = PLANS[form.plan] || PLANS.starter;
      await api.post("/subscriptions", {
        laboratory_id: form.laboratory_id || null,
        plan: form.plan,
        plan_name: p.label,
        status: form.status,
        started_at: form.started_at || undefined,
        expires_at: form.expires_at || undefined,
        price_monthly: p.price,
        currency: form.currency || "EUR",
        max_users: p.max_users,
        max_patients: p.max_patients,
        max_analyses: p.max_analyses,
        auto_renew: form.auto_renew,
      });
      setOpen(false);
      setForm({ ...emptyForm });
      void load();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création de l'abonnement");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.patch(`/subscriptions/${id}`, { status }); void load(); } catch {}
  };

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  const labName = (id: string) => labs.find((l) => l.id === id)?.name || labs.find((l) => l.id === id)?.code || "—";
  const activeCount = subs.filter(s => s.status === "active").length;

  return (
    <MotionDiv variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <MotionDiv variants={fadeUp}>
        <PageHeader
          title="Abonnements"
          description="Gestion des abonnements des laboratoires. La création n'est pas bloquée : les informations manquantes peuvent être complétées plus tard."
          action={
            <Button onClick={() => { setError(""); setForm({ ...emptyForm }); setOpen(true); }} className="bg-[#07122E] text-white hover:bg-[#0B172C]">
              <Plus className="h-4 w-4 mr-2" /> Nouvel abonnement
            </Button>
          }
        />
      </MotionDiv>

      <MotionDiv variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200"><CardContent className="pt-5 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center"><CreditCard className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">Total abonnements</p><p className="text-xl font-bold text-slate-900">{subs.length}</p></div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-5 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">Actifs</p><p className="text-xl font-bold text-[#07122E]">{activeCount}</p></div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-5 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center"><Building2 className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">Laboratoires</p><p className="text-xl font-bold text-slate-900">{labs.length}</p></div></CardContent></Card>
      </MotionDiv>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un abonnement</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="laboratory_id">Laboratoire (laboratory_id)</Label>
              <select id="laboratory_id" value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="">— Aucun / à affecter plus tard —</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name || l.code} ({l.code || "—"})</option>)}
              </select>
              {labs.length === 0 && <p className="text-xs text-slate-500">Aucun laboratoire chargé pour l’instant (vous pouvez quand même créer/compléter plus tard).</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan">Plan (plan)</Label>
              <select id="plan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Statut (status)</Label>
              <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="trial">trial (essai)</option>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="started_at">Début (started_at)</Label><Input id="started_at" type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="expires_at">Expiration (expires_at)</Label><Input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="currency">Devise (currency)</Label><Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div className="space-y-1">
              <Label htmlFor="auto_renew">Renouvellement auto (auto_renew)</Label>
              <select id="auto_renew" value={form.auto_renew ? "true" : "false"} onChange={(e) => setForm({ ...form, auto_renew: e.target.value === "true" })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div className="sm:col-span-2 rounded-lg border border-[#3D9597]/20 bg-[#3D9597]/10 p-3 text-sm text-[#07122E]">
              <p className="font-medium">Inclus automatiquement (selon plan)</p>
              <p>{PLANS[form.plan]?.label}: {PLANS[form.plan]?.price} {form.currency}/mois · {PLANS[form.plan]?.max_users} utilisateurs · {PLANS[form.plan]?.max_patients} patients · {PLANS[form.plan]?.max_analyses} analyses. L’identifiant est attribué automatiquement.</p>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-[#07122E] text-white hover:bg-[#0B172C]">{saving ? "Création…" : "Créer l'abonnement"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MotionDiv variants={fadeUp}>
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Laboratoire</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Statut</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Prix/mois</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && subs.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Aucun abonnement. Créez-en un (même sans laboratoire sélectionné, à compléter plus tard).</td></tr>
                  )}
                  {subs.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">{labName(s.laboratory_id)}</td>
                      <td className="px-4 py-3 capitalize">{s.plan || s.plan_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.status === "active" ? "bg-[#3D9597]/10 text-[#07122E] border border-[#3D9597]/20" : s.status === "trial" ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {s.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{s.price_monthly ?? "—"} {s.currency || ""}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {s.status !== "active" && <button onClick={() => updateStatus(s.id, "active")} className="text-xs px-2.5 py-1 rounded-md bg-[#07122E] text-white hover:bg-[#0B172C]">Activer</button>}
                        {s.status === "active" && <button onClick={() => updateStatus(s.id, "expired")} className="text-xs px-2.5 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-800">Expirer</button>}
                      </td>
                    </motion.tr>
                  ))}
                  {loading && subs.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100"><td colSpan={5} className="px-4 py-4"><div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {loading && <p className="text-xs text-slate-400 mt-2">Actualisation en cours… (l’application reste utilisable)</p>}
      </MotionDiv>
    </MotionDiv>
  );
}


