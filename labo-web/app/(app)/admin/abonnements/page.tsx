"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, Button, Input, Label } from "@/components/ui";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const initialForm = {
  laboratory_id: "",
  plan: "starter",
  plan_name: "Starter",
  status: "trial",
  started_at: "",
  expires_at: "",
  price_monthly: "0",
  currency: "EUR",
  max_users: "",
  max_patients: "",
  max_analyses: "",
  auto_renew: true,
};

export default function AdminAbonnementsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = React.useState<any[]>([]);
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...initialForm });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

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
      setSubs([]); setLabs([]);
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
      // Champs alignés sur la table subscriptions
      await api.post("/subscriptions", {
        laboratory_id: form.laboratory_id,
        plan: form.plan,
        plan_name: form.plan_name || form.plan,
        status: form.status,
        started_at: form.started_at || undefined,
        expires_at: form.expires_at || undefined,
        price_monthly: form.price_monthly === "" ? 0 : Number(form.price_monthly),
        currency: form.currency || "EUR",
        max_users: form.max_users === "" ? null : Number(form.max_users),
        max_patients: form.max_patients === "" ? null : Number(form.max_patients),
        max_analyses: form.max_analyses === "" ? null : Number(form.max_analyses),
        auto_renew: form.auto_renew,
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

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/subscriptions/${id}`, { status });
      await load();
    } catch {}
  };

  if (user && !user.roles?.includes("super_admin")) {
    return <div className="p-8 text-center text-muted-foreground">Accès réservé au super administrateur.</div>;
  }

  const labName = (id: string) => labs.find((l) => l.id === id)?.name || id;

  return (
    <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Abonnements"
        description="Gestion des abonnements des laboratoires"
        action={
          <Button onClick={() => { setError(""); setForm({ ...initialForm }); setOpen(true); }} className="bg-[#111827] text-white hover:bg-[#374151]">
            <Plus className="h-4 w-4 mr-2" /> Nouvel abonnement
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un abonnement</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="laboratory_id">Laboratoire (laboratory_id) *</Label>
              <select id="laboratory_id" required value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="">Sélectionner un laboratoire</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan">Plan *</Label>
              <select id="plan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="starter">starter</option>
                <option value="professional">professional</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan_name">Nom du plan (plan_name)</Label>
              <Input id="plan_name" value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Statut (status)</Label>
              <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="trial">trial</option>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Devise (currency)</Label>
              <Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="started_at">Début (started_at)</Label>
              <Input id="started_at" type="datetime-local" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expires_at">Expiration (expires_at)</Label>
              <Input id="expires_at" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price_monthly">Prix mensuel (price_monthly)</Label>
              <Input id="price_monthly" type="number" step="0.01" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_users">Max utilisateurs (max_users)</Label>
              <Input id="max_users" type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_patients">Max patients (max_patients)</Label>
              <Input id="max_patients" type="number" value={form.max_patients} onChange={(e) => setForm({ ...form, max_patients: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_analyses">Max analyses (max_analyses)</Label>
              <Input id="max_analyses" type="number" value={form.max_analyses} onChange={(e) => setForm({ ...form, max_analyses: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="auto_renew">Renouvellement auto (auto_renew)</Label>
              <select id="auto_renew" value={form.auto_renew ? "true" : "false"} onChange={(e) => setForm({ ...form, auto_renew: e.target.value === "true" })} className="w-full border border-[#D1D5DB] rounded-md px-3 py-2 text-sm bg-white">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
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
        <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground">Laboratoire</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 text-muted-foreground">Prix/mois</th>
                <th className="text-right px-4 py-3 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-[#E5E7EB]">
                  <td className="px-4 py-3 font-medium">{labName(s.laboratory_id)}</td>
                  <td className="px-4 py-3 capitalize">{s.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.status === "active" ? "bg-green-50 text-green-700" : s.status === "trial" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.price_monthly} {s.currency}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {s.status !== "active" && (
                      <button onClick={() => updateStatus(s.id, "active")} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Activer</button>
                    )}
                    {s.status === "active" && (
                      <button onClick={() => updateStatus(s.id, "expired")} className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700">Expirer</button>
                    )}
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Aucun abonnement.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </MotionDiv>
  );
}
