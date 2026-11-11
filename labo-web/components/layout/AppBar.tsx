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

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#07122E]/80 hover:bg-slate-100 hover:text-[#07122E] transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#07122E] text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">AL</div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-semibold text-[#07122E] tracking-tight">Alliya Labo</span>
              <span className="text-[11px] text-slate-400">Espace de travail</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 h-10 w-60 lg:w-80 ml-1">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm">Rechercher…</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100/80 hover:text-[#07122E] transition-colors">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#3D9597]/80 ring-2 ring-white" />
          </button>
          {user && (
            <Link href="/profil" className="flex items-center gap-2.5 rounded-xl pl-1.5 pr-2.5 py-1.5 hover:bg-slate-50 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#07122E] to-[#2E7A7C] text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white shadow-sm">
                {getInitials(user.first_name || "", user.last_name || "") || "U"}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-sm font-medium text-slate-700 max-w-[150px] truncate">{(user.first_name || "") + " " + (user.last_name || "")}</p>
                <p className="text-[11px] text-[#2E7A7C] capitalize">{role.replace(/_/g, " ")}</p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[#07122E] text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#07122E]/15 to-transparent" />
    </header>
  );
}

export default AppBar;

