"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FlaskConical,
  ClipboardCheck,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Clock,
  Activity,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const MANAGEMENT_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Carnets", href: "/patients", icon: FileText },
  { label: "Dossiers", href: "/patients/dossiers", icon: FileText },
  { label: "Analyses", href: "/analyses", icon: FlaskConical },
  { label: "Résultats", href: "/resultats", icon: ClipboardCheck },
  { label: "Rendez-vous", href: "/rendez-vous", icon: Clock },
  { label: "Rapports", href: "/rapports", icon: BarChart3 },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Laboratoires", href: "/admin/laboratoires", icon: Activity, roles: ["super_admin", "ADMIN"] },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UserCog, roles: ["super_admin", "ADMIN"] },
  { label: "Abonnements", href: "/admin/abonnements", icon: CreditCard, roles: ["super_admin", "ADMIN", "DIR"] },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.some((r) => hasRole(r));
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        onClick={onMobileClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-alliya-turquoise-50 text-alliya-turquoise-700 border border-alliya-turquoise-200"
            : "text-slate-400 hover:bg-muted hover:text-foreground"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            active
              ? "text-alliya-turquoise-700"
              : "text-slate-500 group-hover:text-foreground"
          )}
        />
        {!collapsed && <span className="truncate text-foreground">{item.label}</span>}
      </Link>
    );
  };

  const isSuperAdmin = hasRole("super_admin");

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-border/50 px-4 bg-background/50">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-alliya-turquoise text-white font-bold text-[10px]">
              AL
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              Alliya Labo
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-alliya-turquoise text-white font-bold text-[10px]">
            AL
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-muted hover:text-foreground",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {!isSuperAdmin && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Espace de gestion
              </p>
            )}
            <div className="space-y-1">
              {MANAGEMENT_ITEMS.filter(canSee).map(
                (item) => <NavLink key={item.href} item={item} />
              )}
            </div>
          </div>
        )}
        <div>
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </p>
          )}
          <div className="space-y-1">
            {ADMIN_ITEMS.filter(canSee).map(
              (item) => <NavLink key={item.href} item={item} />
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-border/50 p-3 bg-background/30">
        {user && (
          <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", collapsed && "justify-center")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-alliya-turquoise-100 text-alliya-turquoise-700 text-[10px] font-bold">
              {getInitials(user.first_name, user.last_name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user.roles?.[0] || "Utilisateur"}
                </p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-background transition-all duration-300 lg:flex",
          collapsed ? "w-[64px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-background shadow-xl">
            <button
              onClick={onMobileClose}
              className="absolute right-3 top-4 text-slate-400 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

