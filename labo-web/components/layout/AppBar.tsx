"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, CheckCircle2, Info, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLab } from "@/components/lab/LabProvider";
import { getInitials } from "@/lib/utils";

type Notif = { id: string; title: string; text: string; href?: string; time: string };

export function AppBar({ onMenu }: { onMenu: () => void; collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { activeLab } = useLab();
  const router = useRouter();
  const role = (user?.roles?.[0] || "Utilisateur").replace(/_/g, " ");
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<string[]>([]);
  const [online, setOnline] = React.useState(true);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const storageKey = user?.id ? `alliya_notif_read_${user.id}` : "alliya_notif_read";

  React.useEffect(() => {
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  const notifications = React.useMemo<Notif[]>(() => {
    const items: Notif[] = [];
    if (!user?.avatar_url || !(user as any)?.phone) {
      items.push({ id: "profile", title: "Profil à compléter", text: "Ajoutez votre photo et vos informations.", href: "/profil", time: "À faire" });
    }
    if (activeLab && (!(activeLab as any).email || !(activeLab as any).address || !(activeLab as any).logo_url)) {
      items.push({ id: "lab", title: "Laboratoire incomplet", text: "Complétez les informations ou le logo.", href: "/profil", time: "À faire" });
    }
    return items;
  }, [user, activeLab]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setReadIds(JSON.parse(raw));
      else setReadIds([]);
    } catch { setReadIds([]); }
  }, [storageKey]);

  const persistRead = React.useCallback((ids: string[]) => {
    setReadIds(ids);
    try { localStorage.setItem(storageKey, JSON.stringify(ids)); } catch {}
  }, [storageKey]);

  React.useEffect(() => {
    const valid = new Set(notifications.map((n) => n.id));
    setReadIds((prev) => {
      const next = prev.filter((id) => valid.has(id));
      if (next.length !== prev.length) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        return next;
      }
      return prev;
    });
  }, [notifications, storageKey]);

  const unread = notifications.filter((n) => !readIds.includes(n.id)).length;

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () => persistRead(Array.from(new Set([...readIds, ...notifications.map((n) => n.id)])));
  const handleLogout = async () => { try { await logout(); } finally { router.replace("/login"); } };

  const avatarUrl = (user as any)?.avatar_url as string | undefined;
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Profil";
  const statusDot = online ? "bg-[#3D9597]" : "bg-slate-300";
  const statusTitle = online ? "En ligne" : "Hors ligne";

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px]" aria-hidden="true" onClick={() => setOpen(false)} />}
      <header className="sticky top-0 z-50 h-14 lg:h-16 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="h-full px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center min-w-0">
            <button
              onClick={onMenu}
              className="lg:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#07122E] shadow-sm transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#07122E] shadow-sm transition-colors"
                aria-label="Notifications"
                aria-expanded={open}
              >
                <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3D9597] text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                    {unread}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unread > 0 && <button onClick={markAllRead} className="text-xs text-[#2E7A7C] hover:underline font-medium">Tout lire</button>}
                      <button onClick={() => setOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="Fermer"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <CheckCircle2 className="h-5 w-5 text-[#3D9597] mx-auto mb-1.5" />
                        <p className="text-sm text-slate-600">Aucune notification</p>
                        <p className="text-xs text-slate-400 mt-0.5">Tout est à jour.</p>
                      </div>
                    ) : notifications.map((n) => {
                      const isRead = readIds.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            persistRead(Array.from(new Set([...readIds, n.id])));
                            setOpen(false);
                            if (n.href) router.push(n.href);
                          }}
                          className={`w-full text-left px-3 py-3 flex gap-2.5 hover:bg-slate-50 transition-colors ${isRead ? "opacity-60" : ""}`}
                        >
                          <span className={`mt-0.5 shrink-0 ${isRead ? "text-slate-400" : "text-[#3D9597]"}`}>{isRead ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-800 truncate">{n.title}</span><span className="text-[11px] text-slate-400 shrink-0">{n.time}</span></span>
                            <span className="block text-xs text-slate-500 leading-snug mt-0.5">{n.text}</span>
                          </span>
                          {!isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#3D9597] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link href="/profil" className="hidden lg:flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors min-w-0" title={`${fullName} — ${statusTitle}`}>
              <span className="relative shrink-0">
                <span className="block h-8 w-8 rounded-full overflow-hidden ring-2 ring-slate-100 bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-[10px] font-semibold">
                  {avatarUrl ? <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" /> : (getInitials(user?.first_name || "", user?.last_name || "") || "U")}
                </span>
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusDot}`} title={statusTitle} />
              </span>
              <span className="flex flex-col items-start leading-tight min-w-0 max-w-[140px]">
                <span className="text-[12px] font-semibold text-slate-800 truncate w-full">{fullName}</span>
                <span className="text-[10px] text-[#2E7A7C] capitalize truncate w-full">{role}</span>
              </span>
            </Link>

            <Link href="/profil" className="lg:hidden inline-flex items-center justify-center shrink-0" title={`${fullName} — ${statusTitle}`}>
              <span className="relative">
                <span className="block h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden ring-2 ring-slate-100 bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-xs font-semibold">
                  {avatarUrl ? <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" /> : (getInitials(user?.first_name || "", user?.last_name || "") || "U")}
                </span>
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusDot}`} title={statusTitle} />
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-auto sm:px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#07122E] shadow-sm transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              <span className="hidden lg:inline ml-1.5 text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default AppBar;
