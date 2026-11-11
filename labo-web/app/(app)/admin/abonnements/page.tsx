"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { CreditCard, Plus, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MotionDiv = motion.div;
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminAbonnementsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = React.useState<any[]>([]);
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ laboratory_id: "", plan: "starter", status: "trial", price_monthly: 0 });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.get<any[]>("/subscriptions"),
        api.get<any[]>("/laboratories"),
      ]);
      setSubs(Array.isArray(s.data) ? s.data : []);
      setLabs(Array.isArray(l.data) ? l.data : []);
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
      await api.post("/subscriptions", { ...form, price_monthly: Number(form.price_monthly) });
      setShowForm(false);
      setForm({ laboratory_id: "", plan: "starter", status: "trial", price_monthly: 0 });
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
          <Button onClick={() => setShowForm(true)} className="bg-[#111827] text-white hover:bg-[#374151]">
            <Plus className="h-4 w-4 mr-2" /> Nouvel abonnement
          </Button>
        }
      />

      {showForm && (
        <Card className="border border-[#E5E7EB]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Créer un abonnement</CardTitle>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-slate-500" /></button>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
              <select required value={form.laboratory_id} onChange={(e) => setForm({ ...form, laboratory_id: e.target.value })} className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm">
                <option value="">Sélectionner un laboratoire</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
              </select>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm">
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm">
                <option value="trial">Essai</option>
                <option value="active">Actif</option>
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
              </select>
              <input type="number" placeholder="Prix mensuel" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm" />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" disabled={saving} className="bg-[#111827] text-white hover:bg-[#374151]">{saving ? "Création…" : "Créer"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
