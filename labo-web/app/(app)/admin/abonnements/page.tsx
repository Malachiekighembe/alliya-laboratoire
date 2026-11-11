"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Plus, CreditCard, Building2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


const fadeUp: any = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

const emptyForm = {
  laboratory_id: "",
  plan_name: "Convention",
  status: "active",
  started_at: "",
  expires_at: "",
  indefinite: true,
  price_monthly: "",
  currency: "USD",
  auto_renew: false,
  max_users: "",
  max_patients: "",
  max_analyses: "",
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
  const [visibleCount, setVisibleCount] = React.useState(10);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

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
  React.useEffect(() => { setVisibleCount(10); }, [subs.length]);
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => c + 10);
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [subs.length, visibleCount]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const planName = (form.plan_name || "Convention").trim() || "Convention";
      await api.post("/subscriptions", {
        laboratory_id: form.laboratory_id || null,
        plan: planName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") || "custom",
        plan_name: planName,
        status: form.status,
        started_at: form.started_at || undefined,
        expires_at: form.indefinite ? null : (form.expires_at || null),
        price_monthly: form.price_monthly === "" ? 0 : Number(form.price_monthly),
        currency: form.currency || "USD",
        max_users: form.max_users === "" ? null : Number(form.max_users),
        max_patients: form.max_patients === "" ? null : Number(form.max_patients),
        max_analyses: form.max_analyses === "" ? null : Number(form.max_analyses),
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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Abonnements"
          description="Gestion des abonnements des laboratoires. La création n'est pas bloquée : les informations manquantes peuvent être complétées plus tard."
          action={
            <Button onClick={() => { setError(""); setForm({ ...emptyForm }); setOpen(true); }} className="bg-[#1E2A47] text-white hover:bg-[#162544] shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Nouvel abonnement
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-slate-200"><CardContent className="p-3 sm:pt-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"><div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0"><CreditCard className="h-4 w-4 sm:h-5 sm:w-5" /></div><div className="min-w-0"><p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Total</p><p className="text-base sm:text-xl font-bold text-slate-900">{subs.length}</p></div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-3 sm:pt-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"><div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0"><CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /></div><div className="min-w-0"><p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Actifs</p><p className="text-base sm:text-xl font-bold text-[#07122E]">{activeCount}</p></div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-3 sm:pt-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"><div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#3D9597]/10 text-[#07122E] flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 sm:h-5 sm:w-5" /></div><div className="min-w-0"><p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Labos</p><p className="text-base sm:text-xl font-bold text-slate-900">{labs.length}</p></div></CardContent></Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel abonnement</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-2">
            {error && <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="laboratory_id">Laboratoire — optionnel</Label>
              <select id="laboratory_id" value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="">— À définir plus tard —</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name || l.code || l.id}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan_name">Libellé / Plan (convention)</Label>
              <Input id="plan_name" value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} placeholder="Ex: Convention, Premium…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Statut</Label>
              <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="trial">Essai</option>
                <option value="active">Actif</option>
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price_monthly">Montant mensuel (défini par l’admin)</Label>
              <Input id="price_monthly" type="number" min="0" step="0.01" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} placeholder="Ex: 50" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Devise</Label>
              <Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD, CDF, EUR…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="started_at">Date de début</Label>
              <Input id="started_at" type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration">Durée</Label>
              <select id="duration" value={form.indefinite ? "indefinite" : "fixed"} onChange={(e) => setForm({ ...form, indefinite: e.target.value === "indefinite", expires_at: e.target.value === "indefinite" ? "" : form.expires_at })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="indefinite">Indéterminée (selon convention)</option>
                <option value="fixed">Date d’expiration définie</option>
              </select>
            </div>
            {!form.indefinite && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="expires_at">Date d’expiration</Label>
                <Input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="max_users">Limite utilisateurs (optionnel)</Label>
              <Input id="max_users" type="number" min="0" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_patients">Limite patients (optionnel)</Label>
              <Input id="max_patients" type="number" min="0" value={form.max_patients} onChange={(e) => setForm({ ...form, max_patients: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_analyses">Limite analyses (optionnel)</Label>
              <Input id="max_analyses" type="number" min="0" value={form.max_analyses} onChange={(e) => setForm({ ...form, max_analyses: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="auto_renew">Renouvellement auto</Label>
              <select id="auto_renew" value={form.auto_renew ? "true" : "false"} onChange={(e) => setForm({ ...form, auto_renew: e.target.value === "true" })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-[#3D9597]/60 focus:ring-2 focus:ring-[#3D9597]/20">
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="bg-[#1E2A47] text-white hover:bg-[#162544] shadow-sm">{saving ? "Création…" : "Créer l'abonnement"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <motion.div variants={fadeUp}>
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Laboratoire</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Statut</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Montant/mois</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Durée</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && subs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Aucun abonnement. Créez-en un (même sans laboratoire sélectionné, à compléter plus tard).</td></tr>
                  )}
                  {subs.slice(0, visibleCount).map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 10) * 0.02 }} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">{labName(s.laboratory_id)}</td>
                      <td className="px-4 py-3 capitalize">{s.plan_name || s.plan || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.status === "active" ? "bg-[#3D9597]/10 text-[#07122E] border border-[#3D9597]/20" : s.status === "trial" ? "bg-sky-50 text-sky-700 border border-sky-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {s.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{s.price_monthly ?? "—"} {s.currency || ""}</td>
                      <td className="px-4 py-3 text-slate-600">{s.expires_at ? new Date(s.expires_at).toLocaleDateString("fr-FR") : "Indéterminée"}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {s.status !== "active" && <button onClick={() => updateStatus(s.id, "active")} className="text-xs px-2.5 py-1 rounded-md bg-[#07122E] text-white hover:bg-[#0B172C]">Activer</button>}
                        {s.status === "active" && <button onClick={() => updateStatus(s.id, "expired")} className="text-xs px-2.5 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-800">Expirer</button>}
                      </td>
                    </motion.tr>
                  ))}
                  {loading && subs.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100"><td colSpan={6} className="px-4 py-4"><div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subs.length > visibleCount && <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-xs text-slate-400">Chargement…</div>}
          </CardContent>
        </Card>
        {loading && <p className="text-xs text-slate-400 mt-2">Actualisation en cours… (l’application reste utilisable)</p>}
      </motion.div>
    </motion.div>
  );
}




