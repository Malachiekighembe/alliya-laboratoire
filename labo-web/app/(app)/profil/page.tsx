"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, User, Building2, Camera, Upload, QrCode, Image as ImageIcon, Lock, ShieldCheck, Mail } from "lucide-react";
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

async function compressImageToMax(file: File, maxBytes = 1024 * 1024, maxDim = 1280): Promise<string> {
  const loadImage = () => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Impossible de lire l'image")); };
    img.src = url;
  });
  const img = await loadImage();
  let w = img.width, h = img.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression non supportée");
  ctx.drawImage(img, 0, 0, w, h);
  let quality = 0.92;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  const sizeOf = (d: string) => Math.ceil((d.length - d.indexOf(",") - 1) * 3 / 4);
  while (sizeOf(dataUrl) > maxBytes && quality > 0.4) { quality -= 0.08; dataUrl = canvas.toDataURL("image/jpeg", quality); }
  while (sizeOf(dataUrl) > maxBytes && (w > 320 || h > 320)) {
    w = Math.max(320, Math.round(w * 0.85)); h = Math.max(320, Math.round(h * 0.85));
    canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
    quality = 0.85; dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (sizeOf(dataUrl) > maxBytes && quality > 0.4) { quality -= 0.08; dataUrl = canvas.toDataURL("image/jpeg", quality); }
  }
  if (sizeOf(dataUrl) > maxBytes) throw new Error("Impossible de compresser la photo sous 1 Mo");
  return dataUrl;
}

function passwordIssues(pw: string, confirm: string, current: string) {
  const issues: string[] = [];
  if (!current) issues.push("Mot de passe actuel requis");
  if (pw.length < 8) issues.push("Au moins 8 caractères");
  if (!/[A-Z]/.test(pw)) issues.push("Une majuscule");
  if (!/[a-z]/.test(pw)) issues.push("Une minuscule");
  if (!/[0-9]/.test(pw)) issues.push("Un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("Un caractère spécial");
  if (pw && confirm && pw !== confirm) issues.push("La confirmation ne correspond pas");
  return issues;
}
function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++; if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(5, s);
}
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ProfilPage() {
  const { user, updateUser } = useAuth();
  const [me, setMe] = React.useState<any>(null);
  const [lab, setLab] = React.useState<any>(null);
  const [uForm, setUForm] = React.useState({ first_name: "", last_name: "", email: "", phone: "", matricule: "" });
  const [lForm, setLForm] = React.useState({ name: "", code: "", slug: "", email: "", phone: "", address: "", logo_url: "" });
  const [loading, setLoading] = React.useState(true);
  const [savingUser, setSavingUser] = React.useState(false);
  const [savingLab, setSavingLab] = React.useState(false);
  const [savingPhoto, setSavingPhoto] = React.useState(false);
  const [savingLogo, setSavingLogo] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Email change OTP flow (UI). Backend OTP delivery/verification endpoint must exist to complete.
  const [newEmail, setNewEmail] = React.useState("");
  const [otpSentTo, setOtpSentTo] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [emailMsg, setEmailMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");
  const [publicToken, setPublicToken] = React.useState<string>("");

  React.useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const meRes = await api.safeGet<any>("/users/me");
    const meData = !meRes.error ? meRes.data : user;
    setMe(meData);
    setUForm({ first_name: meData?.first_name || "", last_name: meData?.last_name || "", email: meData?.email || "", phone: meData?.phone || "", matricule: meData?.matricule || "" });
    if (meData?.laboratory_id) {
      const labRes = await api.safeGet<any>(`/laboratories/${meData.laboratory_id}`);
      if (!labRes.error && labRes.data) {
        setLab(labRes.data);
        setLForm({ name: labRes.data.name || "", code: labRes.data.code || "", slug: labRes.data.slug || "", email: labRes.data.email || "", phone: labRes.data.phone || "", address: labRes.data.address || "", logo_url: labRes.data.logo_url || "" });
      }
    }
    const tokRes = await api.safeGet<any>("/users/me/public-profile-token");
    if (!tokRes.error && tokRes.data?.token) setPublicToken(tokRes.data.token);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  const persistMe = (data: any) => {
    setMe(data);
    try { const existing = JSON.parse(localStorage.getItem("user") || "{}"); localStorage.setItem("user", JSON.stringify({ ...existing, ...data })); } catch {}
    updateUser(data);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setSavingUser(true); setMsg("");
    try {
      // email change must go through OTP flow; keep current email here
      const res = await api.patch<any>(`/users/me`, { first_name: uForm.first_name || "", last_name: uForm.last_name || "", phone: uForm.phone || null });
      persistMe(res.data);
      setMsg("Profil utilisateur mis à jour.");
    } catch (e: any) { setMsg(e?.message || "Erreur mise à jour profil"); }
    finally { setSavingUser(false); }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    if (!file.type.startsWith("image/")) { setMsg("Veuillez choisir une image."); return; }
    setSavingPhoto(true); setMsg("");
    try {
      const dataUrl = await compressImageToMax(file, 1024 * 1024);
      const res = await api.patch<any>(`/users/me`, { avatar_url: dataUrl });
      persistMe(res.data); setMsg("Photo de profil mise à jour (max 1 Mo).");
    } catch (err: any) { setMsg(err?.message || "Erreur lors de l'upload de la photo"); }
    finally { setSavingPhoto(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lab) return;
    if (!file.type.startsWith("image/")) { setMsg("Veuillez choisir une image pour le logo."); return; }
    setSavingLogo(true); setMsg("");
    try {
      const dataUrl = await compressImageToMax(file, 1024 * 1024);
      const res = await api.patch<any>(`/laboratories/${lab.id}`, { logo_url: dataUrl });
      setLab(res.data); setLForm((f) => ({ ...f, logo_url: dataUrl })); setMsg("Logo du laboratoire mis à jour (max 1 Mo).");
    } catch (err: any) { setMsg(err?.message || "Erreur lors de l'upload du logo"); }
    finally { setSavingLogo(false); if (logoRef.current) logoRef.current.value = ""; }
  };

  const canEditLab = user && (user.roles?.includes("admin") || user.roles?.includes("lab_manager") || user.roles?.includes("super_admin"));

  const saveLab = async (e: React.FormEvent) => {
    e.preventDefault(); if (!lab) return;
    setSavingLab(true); setMsg("");
    try {
      const res = await api.patch(`/laboratories/${lab.id}`, { name: lForm.name || null, slug: lForm.slug || null, email: lForm.email || null, phone: lForm.phone || null, address: lForm.address || null, logo_url: lForm.logo_url || null });
      setLab(res.data); setMsg("Profil du laboratoire mis à jour.");
    } catch (e: any) { setMsg(e?.message || "Erreur mise à jour laboratoire"); }
    finally { setSavingLab(false); }
  };

  const pwMismatch = !!(pw.next && pw.confirm && pw.next !== pw.confirm);
  const pwOk = passwordIssues(pw.next, pw.confirm, pw.current).length === 0;

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me?.id) return;
    const issues = passwordIssues(pw.next, pw.confirm, pw.current);
    if (issues.length) { setPwMsg({ type: "err", text: issues.join(" · ") }); return; }
    setSavingPw(true); setPwMsg(null);
    try {
      await api.patch(`/users/${me.id}/password`, { current_password: pw.current, new_password: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({ type: "ok", text: "Mot de passe modifié avec succès." });
    } catch (err: any) {
      setPwMsg({ type: "err", text: err?.message || "Erreur lors du changement de mot de passe" });
    } finally { setSavingPw(false); }
  };

  const requestEmailOtp = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email)) { setEmailMsg({ type: "err", text: "Veuillez entrer une adresse email valide." }); return; }
    if (email === (uForm.email || "").toLowerCase()) { setEmailMsg({ type: "err", text: "Cette adresse est déjà votre email actuel." }); return; }
    setSendingOtp(true); setEmailMsg(null); setDevCode(null);
    try {
      const res = await api.post<any>("/users/me/email/request-otp", { email });
      if (res?.success === false) throw new Error(res?.message || "Impossible d'envoyer le code");
      const data = res?.data || {};
      setOtpSentTo(email); setOtpCode("");
      if (data.devCode) setDevCode(String(data.devCode));
      if (data.sent) {
        setEmailMsg({ type: "ok", text: `Un code OTP a été envoyé à ${email}. Saisissez-le pour confirmer (pensez à vérifier les spams).` });
      } else if (data.devCode) {
        setEmailMsg({ type: "ok", text: `Email non envoyé (SMTP non configuré ou indisponible). Utilisez le code de développement affiché ci-dessous.` });
      } else {
        setEmailMsg({ type: "ok", text: `Demande OTP enregistrée pour ${email}. Si vous ne recevez pas d'email, vérifiez la configuration SMTP.` });
      }
    } catch (err: any) {
      setEmailMsg({ type: "err", text: err?.message || "Envoi du code OTP indisponible pour le moment (service email/OTP non configuré). Contactez l'administrateur." });
    } finally { setSendingOtp(false); }
  };

  const verifyEmailOtp = async () => {
    if (!otpSentTo) { setEmailMsg({ type: "err", text: "Demandez d'abord un code OTP." }); return; }
    const code = otpCode.trim();
    if (code.length < 4) { setEmailMsg({ type: "err", text: "Veuillez entrer le code OTP reçu." }); return; }
    setVerifyingOtp(true); setEmailMsg(null);
    try {
      const res = await api.post<any>("/users/me/email/verify-otp", { email: otpSentTo, code });
      if (res?.success === false) throw new Error(res?.message || "Code invalide");
      const updated = res?.data || { ...me, email: otpSentTo };
      persistMe(updated);
      setUForm((f) => ({ ...f, email: updated.email || otpSentTo }));
      setNewEmail(""); setOtpSentTo(null); setOtpCode("");
      setEmailMsg({ type: "ok", text: "Adresse email mise à jour et confirmée." });
    } catch (err: any) {
      setEmailMsg({ type: "err", text: err?.message || "Vérification du code OTP indisponible pour le moment (service email/OTP non configuré)." });
    } finally { setVerifyingOtp(false); }
  };

  if (loading) return <div className="p-6 sm:p-8 text-muted-foreground">Chargement du profil…</div>;
  const uMiss = missingUser(me); const lMiss = lab ? missingLab(lab) : [];
  const avatarUrl = me?.avatar_url as string | undefined;
  const labLogo = (lForm.logo_url || lab?.logo_url) as string | undefined;
  const fullName = `${uForm.first_name || ""} ${uForm.last_name || ""}`.trim() || "Utilisateur";
  const roleLabel = (me?.roles?.[0] || "utilisateur").replace(/_/g, " ");
  const publicProfileUrl = origin && publicToken ? `${origin}/u/${publicToken}` : "";
  const completionFields = [uForm.first_name, uForm.last_name, uForm.email, uForm.phone, avatarUrl, uForm.matricule || me?.matricule, ...(lab ? [lForm.name, lForm.address, lForm.phone, lForm.email] : [])];
  const completionDone = completionFields.filter((v) => !!v && String(v).trim()).length;
  const completionPct = completionFields.length ? Math.round((completionDone / completionFields.length) * 100) : 0;
  const pwScore = passwordScore(pw.next);
  const pwLabels = ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Très fort"];
  const pwColors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-[#3D9597]", "bg-[#2E7A7C]"];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <PageHeader title="Mon profil" description="Informations, photo, matricule, identification QR, email et sécurité." />
      {msg && <div className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700">{msg}</div>}

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1fr,320px]">
        <Card className="border border-[#E5E7EB]">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profil utilisateur</CardTitle></CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-xl font-semibold ring-4 ring-white shadow-sm shrink-0">
                  {avatarUrl ? <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" /> : (getInitials(uForm.first_name, uForm.last_name) || "U")}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p className="font-semibold text-slate-900">{fullName}</p>
                  <p className="text-sm text-slate-500 truncate">{uForm.email || "Email non renseigné"}</p>
                  <p className="text-xs text-[#2E7A7C] mt-0.5 capitalize">{roleLabel}</p>
                  <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={savingPhoto} className="border-slate-200 w-auto">
                      {savingPhoto ? <Upload className="h-4 w-4 mr-1.5 animate-pulse" /> : <Camera className="h-4 w-4 mr-1.5" />}
                      {savingPhoto ? "Traitement…" : "Changer la photo"}
                    </Button>
                    <span className="text-[11px] text-slate-400 self-center">Compressée auto (max 1 Mo)</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1"><span className="font-medium text-slate-700">Complétion du profil</span><span className={completionPct === 100 ? "text-[#2E7A7C] font-semibold" : "text-slate-500"}>{completionPct}%</span></div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-[#3D9597]" : "bg-[#1E2A47]"}`} style={{ width: `${completionPct}%` }} /></div>
                {completionPct === 100 ? <p className="mt-1.5 text-[11px] text-[#2E7A7C] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Profil complet.</p> : <p className="mt-1.5 text-[11px] text-amber-700 flex items-start gap-1"><AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>À compléter : {[...uMiss, ...lMiss].join(", ") || "quelques informations"}</span></p>}
              </div>
            </div>

            <form onSubmit={saveUser} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div><Label>Prénom</Label><Input value={uForm.first_name} onChange={(e) => setUForm({ ...uForm, first_name: e.target.value })} placeholder="Prénom" /></div>
              <div><Label>Nom</Label><Input value={uForm.last_name} onChange={(e) => setUForm({ ...uForm, last_name: e.target.value })} placeholder="Nom" /></div>
              <div className="sm:col-span-2"><Label>Email (actuel)</Label><div className="h-9 sm:h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate">{uForm.email || "—"} <span className="ml-2 text-[11px] text-slate-400">(modification via OTP ci-dessous)</span></div></div>
              <div><Label>Téléphone</Label><Input value={uForm.phone} onChange={(e) => setUForm({ ...uForm, phone: e.target.value })} placeholder="+243 ..." /></div>
              <div><Label>Matricule (système)</Label><div className="h-9 sm:h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono truncate">{uForm.matricule || me?.matricule || "—"}</div></div>
              <div><Label>Rôles</Label><div className="h-9 sm:h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">{Array.isArray(me?.roles) ? me.roles.join(", ") : "—"}</div></div>
              <div><Label>Laboratoire</Label><div className="h-9 sm:h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate">{lab?.name || me?.laboratory_id || "—"}</div></div>
              <div className="sm:col-span-2 flex justify-end pt-1"><Button type="submit" disabled={savingUser} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-auto">{savingUser ? "Enregistrement…" : "Enregistrer le profil"}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] h-fit">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" /> Identification (QR)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-base font-semibold mb-2">
                {avatarUrl ? <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" /> : getInitials(uForm.first_name, uForm.last_name)}
              </div>
              <p className="font-semibold text-slate-900 text-sm">{fullName}</p>
              <p className="text-[11px] text-[#2E7A7C] capitalize">{roleLabel}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Matricule: {uForm.matricule || "—"}</p>
              <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200">
                {publicProfileUrl ? (
                  <QRCodeSVG value={publicProfileUrl} size={150} level="M" includeMargin />
                ) : (
                  <div className="h-[150px] w-[150px] flex items-center justify-center text-[11px] text-slate-400">Génération du lien…</div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Scannez pour ouvrir le profil public (lien sécurisé).</p>
              {publicProfileUrl && (
                <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-[11px] text-[#2E7A7C] hover:underline break-all">
                  {publicProfileUrl}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {lab && (
        <Card className="border border-[#E5E7EB]">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Profil du laboratoire</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                {labLogo ? <img src={labLogo} alt="Logo laboratoire" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7" />}
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <p className="font-semibold text-slate-900">{lForm.name || "Laboratoire"}</p>
                <p className="text-sm text-slate-500">Code: {lForm.code || "—"}</p>
                {canEditLab && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={savingLogo} className="border-slate-200 w-auto">
                      {savingLogo ? <Upload className="h-4 w-4 mr-1.5 animate-pulse" /> : <Camera className="h-4 w-4 mr-1.5" />}{savingLogo ? "Traitement…" : "Changer le logo"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {!canEditLab ? (
              <div className="grid gap-1.5 text-sm"><div><span className="text-muted-foreground">Nom:</span> {lab.name || "—"}</div><div><span className="text-muted-foreground">Code:</span> {lab.code || "—"}</div><div><span className="text-muted-foreground">Adresse:</span> {lab.address || "—"}</div><div><span className="text-muted-foreground">Email:</span> {lab.email || "—"}</div><div><span className="text-muted-foreground">Téléphone:</span> {lab.phone || "—"}</div></div>
            ) : (
              <form onSubmit={saveLab} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Nom du laboratoire</Label><Input value={lForm.name} onChange={(e) => setLForm({ ...lForm, name: e.target.value })} /></div>
                <div><Label>Code (système)</Label><div className="h-9 sm:h-10 flex items-center text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono">{lForm.code || "—"}</div></div>
                <div><Label>Slug</Label><Input value={lForm.slug} onChange={(e) => setLForm({ ...lForm, slug: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={lForm.email} onChange={(e) => setLForm({ ...lForm, email: e.target.value })} /></div>
                <div><Label>Téléphone</Label><Input value={lForm.phone} onChange={(e) => setLForm({ ...lForm, phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Adresse</Label><Input value={lForm.address} onChange={(e) => setLForm({ ...lForm, address: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end pt-1"><Button type="submit" disabled={savingLab} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-auto">{savingLab ? "Enregistrement…" : "Enregistrer le laboratoire"}</Button></div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border border-[#E5E7EB]">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Changer l’adresse email (OTP)</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-w-2xl">
          <p className="text-xs sm:text-sm text-slate-500">Entrez la nouvelle adresse, recevez un code OTP par email, puis validez le code pour confirmer le changement.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr,auto] items-end">
            <div><Label htmlFor="new-email">Nouvelle adresse email</Label><Input id="new-email" type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailMsg(null); }} placeholder="nouvel.email@exemple.com" disabled={!!otpSentTo} /></div>
            <Button type="button" onClick={requestEmailOtp} disabled={sendingOtp || !!otpSentTo || !newEmail.trim()} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-auto">{sendingOtp ? "Envoi…" : "Envoyer le code OTP"}</Button>
          </div>
          {otpSentTo && (
            <div className="grid gap-3 sm:grid-cols-[1fr,auto] items-end p-3 rounded-lg border border-[#3D9597]/20 bg-[#3D9597]/5">
              <div><Label htmlFor="otp-code">Code OTP reçu à <span className="font-medium">{otpSentTo}</span></Label><Input id="otp-code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Entrez le code" inputMode="numeric" autoComplete="one-time-code" /></div>
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setOtpSentTo(null); setOtpCode(""); setDevCode(null); setEmailMsg(null); }} className="w-auto">Annuler</Button><Button type="button" onClick={verifyEmailOtp} disabled={verifyingOtp || otpCode.trim().length < 4} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] hover:!bg-[#2E7A7C] w-auto">{verifyingOtp ? "Vérification…" : "Valider"}</Button></div>
              {devCode && <div className="sm:col-span-2 text-sm px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">Code de développement : <span className="font-mono font-semibold tracking-wider">{devCode}</span></div>}
            </div>
          )}
          {emailMsg && <div className={`text-sm px-3 py-2 rounded-lg border ${emailMsg.type === "ok" ? "border-[#3D9597]/25 bg-[#3D9597]/10 text-[#2E7A7C]" : "border-red-200 bg-red-50 text-red-700"}`}>{emailMsg.text}</div>}
        </CardContent>
      </Card>

      <Card className="border border-[#E5E7EB]">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Sécurité — Changer le mot de passe</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 max-w-2xl">
            <div className="sm:col-span-2"><Label htmlFor="pw-current">Mot de passe actuel</Label><Input id="pw-current" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Votre mot de passe actuel" autoComplete="current-password" /></div>
            <div><Label htmlFor="pw-next">Nouveau mot de passe</Label><Input id="pw-next" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Nouveau mot de passe" autoComplete="new-password" /></div>
            <div>
              <Label htmlFor="pw-confirm">Confirmer le nouveau mot de passe</Label>
              <Input id="pw-confirm" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Retapez le nouveau mot de passe" autoComplete="new-password" className={pwMismatch ? "border-red-300 focus-visible:ring-red-200" : pw.confirm && pw.next === pw.confirm ? "border-[#3D9597]/50" : ""} />
              {pwMismatch && <p className="mt-1 text-xs text-red-600">La confirmation ne correspond pas au nouveau mot de passe.</p>}
              {!pwMismatch && pw.confirm && pw.next === pw.confirm && <p className="mt-1 text-xs text-[#2E7A7C] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Les mots de passe correspondent.</p>}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Force du mot de passe</span><span className="font-medium text-slate-700">{pw.next ? pwLabels[pwScore] : "—"}</span></div>
              <div className="flex gap-1">{[1,2,3,4,5].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${pwScore >= i ? pwColors[pwScore] : "bg-slate-200"}`} />)}</div>
              <ul className="text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <li className={pw.next.length >= 8 ? "text-[#2E7A7C]" : ""}>• 8 caractères minimum</li>
                <li className={/[A-Z]/.test(pw.next) ? "text-[#2E7A7C]" : ""}>• Une lettre majuscule</li>
                <li className={/[a-z]/.test(pw.next) ? "text-[#2E7A7C]" : ""}>• Une lettre minuscule</li>
                <li className={/[0-9]/.test(pw.next) ? "text-[#2E7A7C]" : ""}>• Un chiffre</li>
                <li className={/[^A-Za-z0-9]/.test(pw.next) ? "text-[#2E7A7C]" : ""}>• Un caractère spécial</li>
                <li className={pw.next && pw.confirm && pw.next === pw.confirm ? "text-[#2E7A7C]" : ""}>• Confirmation identique</li>
              </ul>
            </div>
            {pwMsg && <div className={`sm:col-span-2 text-sm px-3 py-2 rounded-lg border ${pwMsg.type === "ok" ? "border-[#3D9597]/25 bg-[#3D9597]/10 text-[#2E7A7C]" : "border-red-200 bg-red-50 text-red-700"}`}>{pwMsg.text}</div>}
            <div className="sm:col-span-2 flex justify-end pt-1"><Button type="submit" disabled={savingPw || !pwOk} className="!bg-[#1E2A47] !text-white hover:!bg-[#162544] w-auto"><ShieldCheck className="h-4 w-4 mr-2" />{savingPw ? "Mise à jour…" : "Mettre à jour le mot de passe"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
