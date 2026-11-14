"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FlaskConical, ClipboardCheck, BarChart3, UserCog,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Clock, Activity, CreditCard, Stethoscope, Building2, ShieldCheck, UserCircle,
  ClipboardList, BookOpen,
  ScanLine,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLab } from "@/components/lab/LabProvider";
import { cn, getInitials } from "@/lib/utils";

export type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };
export type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const NAVY = "#0f1b33";
const NAVY_2 = "#162544";
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
    { label: "Catalogue d'examens", href: "/catalogue", icon: BookOpen },
    { label: "Personnel", href: "/personnel", icon: Users },
    { label: "Facturation", href: "/facturation", icon: CreditCard },
    { label: "Rapports", href: "/rapports", icon: BarChart3 },
    { label: "Profil & infos", href: "/profil", icon: UserCircle },
    { label: "Paramètres", href: "/parametres", icon: Settings },
  ]},
  { title: "Activité", roles: ["admin", "lab_manager", "DIR"], items: [
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Rendez-vous", href: "/rendez-vous", icon: Clock },
    { label: "Visites", href: "/visites", icon: Activity },
    { label: "Demandes", href: "/demandes", icon: ClipboardList },
{ label: "Scanner", href: "/scanner", icon: ScanLine },
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
    { label: "Rendez-vous", href: "/rendez-vous", icon: Clock },
    { label: "Visites", href: "/visites", icon: Activity },
    { label: "Scanner", href: "/scanner", icon: ScanLine },
    { label: "Demandes", href: "/demandes", icon: ClipboardList },
    { label: "Catalogue", href: "/catalogue", icon: BookOpen },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const TECH_SECTIONS: NavSection[] = [
  { title: "Laboratoire", roles: ["technician", "laborant"], items: [
    { label: "Tableau de bord", href: "/dashboard/technician", icon: LayoutDashboard },
    { label: "Demandes", href: "/demandes", icon: ClipboardList },
    { label: "Scanner", href: "/scanner", icon: ScanLine },
{ label: "Scanner", href: "/scanner", icon: ScanLine },
        { label: "Prélèvements", href: "/prelevements", icon: Stethoscope },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Catalogue", href: "/catalogue", icon: BookOpen },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Mon profil", href: "/profil", icon: UserCircle },
  ]},
];
const DOCTOR_SECTIONS: NavSection[] = [
  { title: "Médecin", roles: ["doctor"], items: [
    { label: "Tableau de bord", href: "/dashboard/doctor", icon: LayoutDashboard },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Demandes", href: "/demandes", icon: ClipboardList },
    { label: "Scanner", href: "/scanner", icon: ScanLine },
    { label: "Analyses", href: "/analyses", icon: FlaskConical },
    { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
    { label: "Validations", href: "/validations", icon: ShieldCheck },
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
export const ALL_SECTIONS = [...SYSTEM_SECTIONS, ...LAB_OWNER_SECTIONS, ...RECEPTION_SECTIONS, ...TECH_SECTIONS, ...DOCTOR_SECTIONS, ...VIEWER_SECTIONS];

export interface SidebarProps { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void; }

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();
  const { activeLab } = useLab();
  const labName = activeLab?.name || "Alliya Labo";
  const labSub = activeLab?.code ? `Matricule: ${activeLab.code}` : "Système de laboratoire";
  const labLogo = activeLab?.logo_url as string | undefined;

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
            ? "bg-white/[0.08] text-white"
            : "text-slate-300/75 hover:bg-white/[0.05] hover:text-slate-100"
        )}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#3D9597]/80" />}
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors", active ? "bg-white/[0.08]" : "group-hover:bg-white/[0.04]")}> 
          <Icon className={cn("h-[18px] w-[18px]", active ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200")} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 100%)` }}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-white/[0.08]">
        <Link href="/dashboard" className={cn("flex items-center gap-2.5 min-w-0", collapsed && "mx-auto")}> 
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm bg-gradient-to-br from-[#3D9597]/80 to-[#2E7A7C]/80 overflow-hidden shrink-0">
            {labLogo ? <img src={labLogo} alt={labName} className="h-full w-full object-cover" /> : getInitials(labName, "") || "AL"}
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <p className="text-slate-100 font-semibold tracking-tight truncate" title={labName}>{labName}</p>
              <p className="text-[10px] text-slate-400/80 truncate" title={labSub}>{labSub}</p>
            </div>
          )}
        </Link>
        <button onClick={onToggle} className={cn("hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors", collapsed && "hidden")}> 
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
      <div className="border-t border-white/[0.08] p-2.5 space-y-1">
        {user && (
          <Link href="/profil" className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-white/[0.05] transition-colors", collapsed && "justify-center")} title="Mon profil"> 
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-[#2a3d5f] to-[#3D9597]/70">
              {(user as any)?.avatar_url ? (
                <img src={(user as any).avatar_url} alt="Profil" className="h-full w-full object-cover" />
              ) : (
                getInitials(user.first_name || "", user.last_name || "")
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{(user.first_name || "") + " " + (user.last_name || "") || "Mon profil"}</p>
                <p className="truncate text-xs capitalize text-[#6bbfc1]">{(user.roles?.[0] || "Utilisateur").replace(/_/g, " ")}</p>
              </div>
            )}
          </Link>
        )}
        <button onClick={handleLogout} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors", collapsed && "justify-center")} title="Déconnexion"> 
          <span className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"><LogOut className="h-[18px] w-[18px]" /></span>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col transition-all duration-300 shadow-xl print:hidden", collapsed ? "w-[76px]" : "w-64")}> 
        {content}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]" onClick={onMobileClose} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="absolute inset-y-0 left-0 w-[min(18rem,86vw)] shadow-2xl border-r border-white/10 overflow-hidden">
              <button onClick={onMobileClose} className="absolute right-2.5 top-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Fermer le menu"><X className="h-4 w-4" /></button>
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
