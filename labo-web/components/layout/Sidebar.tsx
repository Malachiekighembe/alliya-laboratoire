"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, FlaskConical, ClipboardCheck, BarChart3, UserCog,
  Settings, LogOut, ChevronLeft, X, Clock, Activity, CreditCard, Stethoscope, Building2, ShieldCheck, UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };
type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const SYSTEM_SECTIONS: NavSection[] = [
  {
    title: "Système",
    roles: ["super_admin"],
    items: [
      { label: "Vue d'ensemble", href: "/dashboard/super-admin", icon: LayoutDashboard },
      { label: "Laboratoires", href: "/admin/laboratoires", icon: Building2 },
      { label: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
      { label: "Utilisateurs système", href: "/admin/utilisateurs", icon: UserCog },
      { label: "Mon profil", href: "/profil", icon: UserCircle },
    ],
  },
];

const LAB_OWNER_SECTIONS: NavSection[] = [
  {
    title: "Mon laboratoire",
    roles: ["admin", "lab_manager", "DIR"],
    items: [
      { label: "Tableau de bord", href: "/dashboard/lab-admin", icon: LayoutDashboard },
      { label: "Personnel", href: "/personnel", icon: Users },
      { label: "Facturation", href: "/facturation", icon: CreditCard },
      { label: "Rapports", href: "/rapports", icon: BarChart3 },
      { label: "Profil & infos", href: "/profil", icon: UserCircle },
      { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
  },
  {
    title: "Activité",
    roles: ["admin", "lab_manager", "DIR"],
    items: [
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Visites", href: "/visites", icon: Activity },
      { label: "Prélèvements", href: "/prelevements", icon: Stethoscope },
      { label: "Analyses", href: "/analyses", icon: FlaskConical },
      { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
      { label: "Validations", href: "/validations", icon: ShieldCheck },
    ],
  },
];

const RECEPTION_SECTIONS: NavSection[] = [
  {
    title: "Réception",
    roles: ["receptionist"],
    items: [
      { label: "Tableau de bord", href: "/dashboard/receptionist", icon: LayoutDashboard },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Visites", href: "/visites", icon: Activity },
      { label: "Rendez-vous", href: "/rendez-vous", icon: Clock },
      { label: "Mon profil", href: "/profil", icon: UserCircle },
    ],
  },
];

const TECH_SECTIONS: NavSection[] = [
  {
    title: "Laboratoire",
    roles: ["technician", "laborant"],
    items: [
      { label: "Tableau de bord", href: "/dashboard/technician", icon: LayoutDashboard },
      { label: "Prélèvements", href: "/prelevements", icon: Stethoscope },
      { label: "Analyses", href: "/analyses", icon: FlaskConical },
      { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Mon profil", href: "/profil", icon: UserCircle },
    ],
  },
];

const DOCTOR_SECTIONS: NavSection[] = [
  {
    title: "Médecin",
    roles: ["doctor"],
    items: [
      { label: "Tableau de bord", href: "/dashboard/doctor", icon: LayoutDashboard },
      { label: "Validations", href: "/validations", icon: ShieldCheck },
      { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
      { label: "Analyses", href: "/analyses", icon: FlaskConical },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Rapports", href: "/rapports", icon: BarChart3 },
      { label: "Mon profil", href: "/profil", icon: UserCircle },
    ],
  },
];

const VIEWER_SECTIONS: NavSection[] = [
  {
    title: "Consultation",
    roles: ["viewer"],
    items: [
      { label: "Tableau de bord", href: "/dashboard/viewer", icon: LayoutDashboard },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Analyses", href: "/analyses", icon: FlaskConical },
      { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
      { label: "Mon profil", href: "/profil", icon: UserCircle },
    ],
  },
];

const ALL_SECTIONS: NavSection[] = [
  ...SYSTEM_SECTIONS,
  ...LAB_OWNER_SECTIONS,
  ...RECEPTION_SECTIONS,
  ...TECH_SECTIONS,
  ...DOCTOR_SECTIONS,
  ...VIEWER_SECTIONS,
];

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => { await logout(); router.push("/login"); };
  const canSeeItem = (item: NavItem) => !item.roles || item.roles.some((r) => hasRole(r));
  const canSeeSection = (section: NavSection) => !section.roles || section.roles.some((r) => hasRole(r));

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link href={item.href} onClick={onMobileClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active ? "bg-teal-50 text-teal-800 border border-teal-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-teal-700" : "text-slate-400")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-[10px]">AL</div>
            <span className="font-semibold text-slate-900 tracking-tight">Alliya Labo</span>
          </Link>
        )}
        {collapsed && <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-[10px]">AL</div>}
        <button onClick={onToggle} className={cn("hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700", collapsed && "hidden")}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {ALL_SECTIONS.filter(canSeeSection).map((section) => {
          const visibleItems = section.items.filter(canSeeItem);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>}
              <div className="space-y-1">{visibleItems.map((item) => <NavLink key={item.href} item={item} />)}</div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        {user && (
          <Link href="/profil" className={cn("flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50", collapsed && "justify-center")} title="Mon profil">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">
              {getInitials(user.first_name || "", user.last_name || "")}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{(user.first_name || "") + " " + (user.last_name || "") || "Mon profil"}</p>
                <p className="truncate text-xs text-slate-400">{user.roles?.[0] || "Utilisateur"}</p>
              </div>
            )}
          </Link>
        )}
        <button onClick={handleLogout} className={cn("mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors", collapsed && "justify-center")}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex", collapsed ? "w-[64px]" : "w-64")}>
        {sidebarContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button onClick={onMobileClose} className="absolute right-3 top-4 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
