"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Building2, Shield, BadgeCheck, UserCircle2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "").replace(/\/api\/v1$/i, "");
const API_PUBLIC_BASE = `${API_ROOT}/api/v1`;

type PublicProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  matricule?: string | null;
  roles?: string[];
  laboratory?: { id: string; name?: string | null; code?: string | null; logo_url?: string | null } | null;
};

export default function PublicProfileClient({ id }: { id: string }) {
  const [data, setData] = React.useState<PublicProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => { setOrigin(window.location.origin); }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_PUBLIC_BASE}/users/public/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.data) throw new Error(json?.message || "Profil introuvable");
        if (active) setData(json.data);
      } catch (e: any) {
        if (active) setError(e?.message || "Impossible de charger le profil");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#07122E] via-[#1E2A47] to-[#143b4a] flex items-center justify-center p-4"><div className="text-white/80 text-sm">Chargement du profil…</div></div>;
  }
  if (error || !data) {
    return <div className="min-h-screen bg-gradient-to-br from-[#07122E] via-[#1E2A47] to-[#143b4a] flex items-center justify-center p-4"><div className="max-w-md w-full bg-white/95 rounded-2xl p-6 text-center shadow-xl"><UserCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-700 font-medium">Profil indisponible</p><p className="text-sm text-slate-500 mt-1">{error || "Ce profil n'existe pas ou n'est plus accessible."}</p></div></div>;
  }

  const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "Utilisateur";
  const roleLabel = (data.roles?.[0] || "utilisateur").replace(/_/g, " ");
  const profileUrl = origin ? `${origin}/u/${id}` : "";
  const lab = data.laboratory;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07122E] via-[#1E2A47] to-[#143b4a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="h-24 sm:h-28 bg-gradient-to-r from-[#07122E] to-[#3D9597]" />
          <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-white shadow-lg">
                {data.avatar_url ? <img src={data.avatar_url} alt={fullName} className="h-full w-full object-cover" /> : getInitials(data.first_name || "", data.last_name || "")}
              </div>
              <h1 className="mt-3 text-xl sm:text-2xl font-semibold text-slate-900">{fullName}</h1>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3D9597]/10 text-[#2E7A7C] text-xs font-medium capitalize">
                <Shield className="h-3.5 w-3.5" /> {roleLabel}
              </div>
              {data.matricule && <p className="mt-2 text-sm text-slate-500">Matricule <span className="font-mono font-medium text-slate-700">{data.matricule}</span></p>}
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full"><BadgeCheck className="h-3.5 w-3.5" /> Profil vérifié Alliya</div>
            </div>

            {lab && (
              <div className="mt-5 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {lab.logo_url ? <img src={lab.logo_url} alt={lab.name || "Labo"} className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-slate-400" />}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs text-slate-500">Laboratoire</p>
                  <p className="font-medium text-slate-900 truncate">{lab.name || "—"}</p>
                  {lab.code && <p className="text-xs text-[#2E7A7C] font-mono">{lab.code}</p>}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
              {profileUrl && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <QRCodeSVG value={profileUrl} size={120} level="M" includeMargin />
                </div>
              )}
              <div className="text-center sm:text-left text-xs text-slate-500 max-w-[220px]">
                <p className="font-medium text-slate-700 mb-1">Profil public Alliya</p>
                <p>Scannez le QR code pour ouvrir cette page d’identification.</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-white/50 mt-4">Alliya Laboratoire · Identification</p>
      </div>
    </div>
  );
}
