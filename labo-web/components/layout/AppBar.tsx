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
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#07122E] hover:bg-slate-100"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#07122E] text-white text-[10px] font-bold flex items-center justify-center">AL</div>
            <span className="hidden sm:block text-sm font-semibold text-[#07122E] tracking-tight">Alliya Labo</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 h-9 w-56 lg:w-72 ml-2">
            <Search className="h-4 w-4" />
            <span className="text-sm">Rechercher…</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#07122E]">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#3D9597]" />
          </button>
          {user && (
            <Link href="/profil" className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#07122E] to-[#3D9597] text-white flex items-center justify-center text-xs font-semibold">
                {getInitials(user.first_name || "", user.last_name || "") || "U"}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-sm font-medium text-slate-800 max-w-[140px] truncate">{(user.first_name || "") + " " + (user.last_name || "")}</p>
                <p className="text-[11px] text-[#3D9597] capitalize font-medium">{role.replace(/_/g, " ")}</p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#07122E] text-white text-sm font-medium hover:bg-[#0B172C] transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-[#07122E] via-[#1E2A47] to-[#3D9597]" />
    </header>
  );
}

export default AppBar;

