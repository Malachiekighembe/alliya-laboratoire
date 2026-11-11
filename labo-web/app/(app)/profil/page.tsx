"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, User, Building2, Camera, Upload } from "lucide-react";
import { getInitials } from "@/lib/utils";

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilPage() {
  const { user, updateUser } = useAuth();
  const [me, setMe] = React.useState<any>(null);
  const [lab, setLab] = React.useState<any>(null);
  const [uForm, setUForm] = React.useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [lForm, setLForm] = React.useState({ name: "", code: "", slug: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = React.useState(true);
  const [savingUser, setSavingUser] = React.useState(false);
  const [savingLab, setSavingLab] = React.useState(false);
  const [savingPhoto, setSavingPhoto] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");
  const fileRef = React.useRef<HTMLInputElement>(null);

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

  const persistMe = (data: any) => {
    setMe(data);
    try {
      const existing = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...existing, ...data }));
    } catch {}
    updateUser(data);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setSavingUser(true); setMsg("");
    try {
      const res = await api.patch<any>(`/users/me`, { first_name: uForm.first_name || "", last_name: uForm.last_name || "", email: uForm.email || null, phone: uForm.phone || null });
      persistMe(res.data);
      setMsg("Profil utilisateur mis à jour.");
    } catch (e: any) { setMsg(e?.message || "Erreur mise à jour profil"); }
    finally { setSavingUser(false); }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    if (!file.type.startsWith("image/")) { setMsg("Veuillez choisir une image."); return; }
    if (file.size > 2 * 1024 * 1024) { setMsg("Image trop volumineuse (max 2 Mo)."); return; }
    setSavingPhoto(true); setMsg("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.patch<any>(`/users/me`, { avatar_url: dataUrl });
      persistMe(res.data);
      setMsg("Photo de profil mise à jour.");
    } catch (err: any) { setMsg(err?.message || "Erreur lors de l'upload de la photo"); }
    finally { setSavingPhoto(false); if (fileRef.current) fileRef.current.value = ""; }
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

  if (loading) return <div className="p-6 sm:p-8 text-muted-foreground">Chargement du profil…</div>;
  const uMiss = missingUser(me);
  const lMiss = lab ? missingLab(lab) : [];
  const avatarUrl = me?.avatar_url as string | undefined;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl">
      <PageHeader title="Mon profil" description="Complétez vos informations et votre photo. Les profils incomplets peuvent être complétés plus tard." />
      {msg && <div className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">{msg}</div>}
      {(uMiss.length > 0 || lMiss.length > 0) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Informations à compléter</p>{uMiss.length > 0 && <p>Utilisateur : {uMiss.join(", ")}</p>}{lMiss.length > 0 && <p>Laboratoire : {lMiss.join(", ")}</p>}</div>
        </div>
      )}
      {uMiss.length === 0 && lMiss.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[#3D9597]/25 bg-[#3D9597]/10 px-4 py-3 text-[#2E7A7C] text-sm"><CheckCircle2 className="h-4 w-4" /> Profils complets.</div>
      )}

      <Card className="border border-[#E5E7EB]">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profil utilisateur</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-white shadow-sm shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" /> : (getInitials(uForm.first_name, uForm.last_name) || "U")}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="font-semibold text-slate-900">{(uForm.first_name || "") + " " + (uForm.last_name || "") || "Votre nom"}</p>
              <p className="text-sm text-slate-500 truncate">{uForm.email || "Email non renseigné"}</p>
              <p className="text-xs text-[#2E7A7C] mt-0.5 capitalize">{(me?.roles?.[0] || "utilisateur").replace(/_/g, " ")}</p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={savingPhoto} className="border-slate-200">
                  {savingPhoto ? <Upload className="h-4 w-4 mr-2 animate-pulse" /> : <Camera className="h-4 w-4 mr-2" />}
                  {savingPhoto ? "Envoi…" : "Changer la photo"}
                </Button>
                <span className="text-xs text-slate-400 self-center">JPG/PNG, max 2 Mo</span>
              </div>
            </div>
          </div>

          <form onSubmit={saveUser} className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div><Label>Prénom</Label><Input value={uForm.first_name} onChange={(e) => setUForm({ ...uForm, first_name: e.target.value })} placeholder="Prénom" /></div>
            <div><Label>Nom</Label><Input value={uForm.last_name} onChange={(e) => setUForm({ ...uForm, last_name: e.target.value })} placeholder="Nom" /></div>
            <div><Label>Email</Label><Input type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} placeholder="email@exemple.com" /></div>
            <div><Label>Téléphone</Label><Input value={uForm.phone} onChange={(e) => setUForm({ ...uForm, phone: e.target.value })} placeholder="+243 ..." /></div>
            <div><Label>Rôles</Label><div className="h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">{Array.isArray(me?.roles) ? me.roles.join(", ") : "—"}</div></div>
            <div><Label>Laboratoire</Label><div className="h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate">{me?.laboratory_id || "— (non affecté)"}</div></div>
            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
              <Button type="submit" disabled={savingUser} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto">{savingUser ? "Enregistrement…" : "Enregistrer mon profil"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {lab && (
        <Card className="border border-[#E5E7EB]">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Profil du laboratoire</CardTitle></CardHeader>
          <CardContent>
            {!canEditLab ? (
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Nom:</span> {lab.name || "—"}</div>
                <div><span className="text-muted-foreground">Adresse:</span> {lab.address || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {lab.email || "—"}</div>
                <div><span className="text-muted-foreground">Téléphone:</span> {lab.phone || "—"}</div>
              </div>
            ) : (
              <form onSubmit={saveLab} className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Nom</Label><Input value={lForm.name} onChange={(e) => setLForm({ ...lForm, name: e.target.value })} /></div>
                <div><Label>Code</Label><Input value={lForm.code} onChange={(e) => setLForm({ ...lForm, code: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={lForm.slug} onChange={(e) => setLForm({ ...lForm, slug: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={lForm.email} onChange={(e) => setLForm({ ...lForm, email: e.target.value })} /></div>
                <div><Label>Téléphone</Label><Input value={lForm.phone} onChange={(e) => setLForm({ ...lForm, phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Adresse</Label><Input value={lForm.address} onChange={(e) => setLForm({ ...lForm, address: e.target.value })} /></div>
                <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                  <Button type="submit" disabled={savingLab} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-full sm:w-auto">{savingLab ? "Enregistrement…" : "Enregistrer le laboratoire"}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}





