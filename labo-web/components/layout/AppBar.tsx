"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

export function AppBar({ onMenu }: { onMenu: () => void; collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const role = user?.roles?.[0] || "Utilisateur";

  const handleLogout = async () => {
    try { await logout(); } finally { router.replace("/login"); }
  };

  const avatarUrl = (user as any)?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="h-full px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#07122E] transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200/80 rounded-xl px-3 h-10 w-56 lg:w-80">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400 truncate">Rechercher…</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <button className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#07122E] transition-colors shrink-0">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#3D9597]/70 ring-2 ring-white" />
          </button>
          {user && (
            <Link href="/profil" className="flex items-center gap-2 sm:gap-2.5 rounded-xl pl-1 pr-1.5 sm:pr-2.5 py-1.5 hover:bg-slate-50 transition-colors min-w-0">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-[#1E2A47] to-[#3D9597] text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white/80 shadow-sm shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                ) : (
                  getInitials(user.first_name || "", user.last_name || "") || "U"
                )}
              </div>
              <div className="hidden sm:block leading-tight min-w-0">
                <p className="text-sm font-medium text-slate-700 max-w-[120px] lg:max-w-[150px] truncate">{(user.first_name || "") + " " + (user.last_name || "")}</p>
                <p className="text-[11px] text-[#2E7A7C]/80 capitalize truncate">{role.replace(/_/g, " ")}</p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:text-[#07122E] hover:border-slate-300 transition-colors shrink-0"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppBar;

