"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FlaskConical, ClipboardCheck, BarChart3, UserCog,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Clock, Activity, CreditCard, Stethoscope, Building2, ShieldCheck, UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };
type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const NAVY = "#07122E";
const NAVY_2 = "#0B172C";
const TURQ = "#3D9597";

const SYSTEM_SECTIONS: NavSection[] = [
  { title: "Système", roles: ["super_admin"], items: [
    { label: "Vue d'ensemble", href: "/dashboard/super-admin", icon: LayoutDashboard },
    { label: "Laboratoires", href: "/admin/laboratoires", icon: Building2 },
    { label: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
    { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UserCog },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const LAB_OWNER_SECTIONS: NavSection[] = [
  { title: "Mon laboratoire", roles: ["admin", "lab_manager", "DIR"], items: [
    { label: "Tableau de bord", href: "/dashboard/lab-admin", icon: LayoutDashboard },
    { label: "Personnel", href: "/personnel", icon: Users },
    { label: "Facturation", href: "/facturation", icon: CreditCard },
    { label: "Rapports", href: "/rapports", icon: BarChart3 },
    { label: "Profil & infos", href: "/profil", icon: UserCircle },
    { label: "Paramètres", href: "/parametres", icon: Settings },
  ]},
  { title: "Activité", roles: ["admin", "lab_manager", "DIR"], items: [
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Visites", href: "/visites", icon: Activity },
    { label: "Prélèvements", href: "/prelevements", icon: Stethoscope },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Validations", href: "/validations", icon: ShieldCheck },
  ]},
];
const RECEPTION_SECTIONS: NavSection[] = [
  { title: "Réception", roles: ["receptionist"], items: [
    { label: "Tableau de bord", href: "/dashboard/receptionist", icon: LayoutDashboard },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Visites", href: "/visites", icon: Activity },
    { label: "Rendez-vous", href: "/rendez-vous", icon: Clock },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const TECH_SECTIONS: NavSection[] = [
  { title: "Laboratoire", roles: ["technician", "laborant"], items: [
    { label: "Tableau de bord", href: "/dashboard/technician", icon: LayoutDashboard },
    { label: "Prélèvements", href: "/prelevements", icon: Stethoscope },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const DOCTOR_SECTIONS: NavSection[] = [
  { title: "Médecin", roles: ["doctor"], items: [
    { label: "Tableau de bord", href: "/dashboard/doctor", icon: LayoutDashboard },
    { label: "Validations", href: "/validations", icon: ShieldCheck },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Rapports", href: "/rapports", icon: BarChart3 },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const VIEWER_SECTIONS: NavSection[] = [
  { title: "Consultation", roles: ["viewer"], items: [
    { label: "Tableau de bord", href: "/dashboard/viewer", icon: LayoutDashboard },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const ALL_SECTIONS = [...SYSTEM_SECTIONS, ...LAB_OWNER_SECTIONS, ...RECEPTION_SECTIONS, ...TECH_SECTIONS, ...DOCTOR_SECTIONS, ...VIEWER_SECTIONS];

export interface SidebarProps { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void; }

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => { try { await logout(); } finally { router.push("/login"); } };
  const canSeeItem = (item: NavItem) => !item.roles || item.roles.some((r) => hasRole(r));
  const canSeeSection = (s: NavSection) => !s.roles || s.roles.some((r) => hasRole(r));

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        onClick={onMobileClose}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none",
          collapsed ? "justify-center" : "",
          active
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-300/80 hover:bg-white/5 hover:text-white"
        )}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full" style={{ background: TURQ }} />}
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors", active ? "bg-white/10" : "group-hover:bg-white/5")}> 
          <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-slate-300 group-hover:text-white")} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 100%)` }}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-white/10">
        <Link href="/dashboard" className={cn("flex items-center gap-2.5", collapsed && "mx-auto")}> 
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow" style={{ background: `linear-gradient(135deg, ${TURQ}, #2E7A7C)` }}>AL</div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-white font-semibold tracking-tight">Alliya Labo</p>
              <p className="text-[10px] text-slate-400">Système de laboratoire</p>
            </div>
          )}
        </Link>
        <button onClick={onToggle} className={cn("hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors", collapsed && "hidden")}> 
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {ALL_SECTIONS.filter(canSeeSection).map((section) => {
          const items = section.items.filter(canSeeItem);
          if (!items.length) return null;
          return (
            <div key={section.title}>
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400/80">{section.title}</p>}
              <div className="space-y-1">{items.map((it) => <NavLink key={it.href} item={it} />)}</div>
            </div>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="border-t border-white/10 p-2.5 space-y-1">
        {user && (
          <Link href="/profil" className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-white/5 transition-colors", collapsed && "justify-center")} title="Mon profil"> 
            <div className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: `linear-gradient(135deg, #1E2A47, ${TURQ})` }}>
              {getInitials(user.first_name || "", user.last_name || "")}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{(user.first_name || "") + " " + (user.last_name || "") || "Mon profil"}</p>
                <p className="truncate text-xs capitalize" style={{ color: TURQ }}>{(user.roles?.[0] || "Utilisateur").replace(/_/g, " ")}</p>
              </div>
            )}
          </Link>
        )}
        <button onClick={handleLogout} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors", collapsed && "justify-center")} title="Déconnexion"> 
          <span className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"><LogOut className="h-[18px] w-[18px]" /></span>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col transition-all duration-300 shadow-xl", collapsed ? "w-[76px]" : "w-64")}> 
        {content}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-y-0 left-0 w-72 shadow-2xl">
              <button onClick={onMobileClose} className="absolute right-3 top-4 z-10 h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
