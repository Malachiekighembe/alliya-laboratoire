"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, User, Building2 } from "lucide-react";

function missingUser(u: any) {
  const m: string[] = [];
  if (!u?.first_name) m.push("Prénom");
  if (!u?.last_name) m.push("Nom");
  if (!u?.email) m.push("Email");
  if (!u?.phone) m.push("Téléphone");
  return m;
}
function missingLab(l: any) {
  const m: string[] = [];
  if (!l?.name) m.push("Nom du laboratoire");
  if (!l?.address) m.push("Adresse");
  if (!l?.phone) m.push("Téléphone");
  if (!l?.email) m.push("Email");
  return m;
}

export default function ProfilPage() {
  const { user } = useAuth();
  const [me, setMe] = React.useState<any>(null);
  const [lab, setLab] = React.useState<any>(null);
  const [uForm, setUForm] = React.useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [lForm, setLForm] = React.useState({ name: "", code: "", slug: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = React.useState(true);
  const [savingUser, setSavingUser] = React.useState(false);
  const [savingLab, setSavingLab] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const meRes = await api.safeGet<any>("/users/me");
    const meData = !meRes.error ? meRes.data : user;
    setMe(meData);
    setUForm({ first_name: meData?.first_name || "", last_name: meData?.last_name || "", email: meData?.email || "", phone: meData?.phone || "" });
    if (meData?.laboratory_id) {
      const labRes = await api.safeGet<any>(`/laboratories/${meData.laboratory_id}`);
      if (!labRes.error && labRes.data) {
        setLab(labRes.data);
        setLForm({ name: labRes.data.name || "", code: labRes.data.code || "", slug: labRes.data.slug || "", email: labRes.data.email || "", phone: labRes.data.phone || "", address: labRes.data.address || "" });
      }
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setSavingUser(true); setMsg("");
    try {
      const res = await api.patch<any>(`/users/me`, { first_name: uForm.first_name || "", last_name: uForm.last_name || "", email: uForm.email || null, phone: uForm.phone || null });
      setMe(res.data);
      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...existing, ...(res.data as any) }));
      } catch {}
      setMsg("Profil utilisateur mis à jour.");
    } catch (e: any) { setMsg(e?.message || "Erreur mise à jour profil"); }
    finally { setSavingUser(false); }
  };

  const canEditLab = user && (user.roles?.includes("admin") || user.roles?.includes("lab_manager") || user.roles?.includes("super_admin"));

  const saveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;
    setSavingLab(true); setMsg("");
    try {
      const res = await api.patch(`/laboratories/${lab.id}`, { name: lForm.name || null, code: lForm.code || null, slug: lForm.slug || null, email: lForm.email || null, phone: lForm.phone || null, address: lForm.address || null });
      setLab(res.data);
      setMsg("Profil du laboratoire mis à jour.");
    } catch (e: any) { setMsg(e?.message || "Erreur mise à jour laboratoire"); }
    finally { setSavingLab(false); }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Chargement du profil…</div>;
  const uMiss = missingUser(me);
  const lMiss = lab ? missingLab(lab) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Mon profil" description="Complétez les informations manquantes de votre profil et de votre laboratoire. La création n'est jamais bloquée, mais un profil complet est important." />
      {msg && <div className="text-sm px-3 py-2 rounded-md border bg-slate-50 text-slate-700">{msg}</div>}
      {(uMiss.length > 0 || lMiss.length > 0) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Informations à compléter</p>{uMiss.length > 0 && <p>Utilisateur : {uMiss.join(", ")}</p>}{lMiss.length > 0 && <p>Laboratoire : {lMiss.join(", ")}</p>}</div>
        </div>
      )}
      {uMiss.length === 0 && lMiss.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm"><CheckCircle2 className="h-4 w-4" /> Profils complets.</div>
      )}
      <Card className="border border-[#E5E7EB]">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profil utilisateur (table: users)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveUser} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Prénom (first_name)</Label><Input value={uForm.first_name} onChange={(e) => setUForm({ ...uForm, first_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Nom (last_name)</Label><Input value={uForm.last_name} onChange={(e) => setUForm({ ...uForm, last_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email (email)</Label><Input type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone (phone)</Label><Input value={uForm.phone} onChange={(e) => setUForm({ ...uForm, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>Rôles (roles[])</Label><div className="text-sm px-3 py-2 rounded-md border bg-slate-50">{Array.isArray(me?.roles) ? me.roles.join(", ") : "—"}</div></div>
            <div className="space-y-1"><Label>Laboratoire (laboratory_id)</Label><div className="text-sm px-3 py-2 rounded-md border bg-slate-50 truncate">{me?.laboratory_id || "— (non affecté)"}</div></div>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={savingUser} className="bg-[#0f766e] text-white hover:bg-[#115e59]">{savingUser ? "Enregistrement…" : "Enregistrer mon profil"}</Button></div>
          </form>
        </CardContent>
      </Card>
      {lab && (
        <Card className="border border-[#E5E7EB]">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Profil du laboratoire (table: laboratories)</CardTitle></CardHeader>
          <CardContent>
            {!canEditLab ? (
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Nom:</span> {lab.name || "—"}</div>
                <div><span className="text-muted-foreground">Adresse:</span> {lab.address || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {lab.email || "—"}</div>
                <div><span className="text-muted-foreground">Téléphone:</span> {lab.phone || "—"}</div>
              </div>
            ) : (
              <form onSubmit={saveLab} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2"><Label>Nom (name)</Label><Input value={lForm.name} onChange={(e) => setLForm({ ...lForm, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Code (code)</Label><Input value={lForm.code} onChange={(e) => setLForm({ ...lForm, code: e.target.value })} /></div>
                <div className="space-y-1"><Label>Slug (slug)</Label><Input value={lForm.slug} onChange={(e) => setLForm({ ...lForm, slug: e.target.value })} /></div>
                <div className="space-y-1"><Label>Email (email)</Label><Input type="email" value={lForm.email} onChange={(e) => setLForm({ ...lForm, email: e.target.value })} /></div>
                <div className="space-y-1"><Label>Téléphone (phone)</Label><Input value={lForm.phone} onChange={(e) => setLForm({ ...lForm, phone: e.target.value })} /></div>
                <div className="space-y-1 sm:col-span-2"><Label>Adresse (address)</Label><Input value={lForm.address} onChange={(e) => setLForm({ ...lForm, address: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={savingLab} className="bg-[#0f766e] text-white hover:bg-[#115e59]">{savingLab ? "Enregistrement…" : "Enregistrer le laboratoire"}</Button></div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
