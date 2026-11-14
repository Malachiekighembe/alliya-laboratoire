"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { ALL_SECTIONS, type NavItem } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  onMore: () => void;
};

type RoleNavSpec = { hrefs: string[]; more: boolean };

const ROLE_NAV: Record<string, RoleNavSpec> = {
  super_admin: {
    hrefs: ["/dashboard/super-admin", "/admin/laboratoires", "/admin/abonnements", "/admin/utilisateurs"],
    more: true,
  },
  admin: { hrefs: ["/dashboard/lab-admin", "/patients", "/demandes", "/facturation"], more: true },
  lab_manager: { hrefs: ["/dashboard/lab-admin", "/patients", "/demandes", "/facturation"], more: true },
  DIR: { hrefs: ["/dashboard/lab-admin", "/patients", "/demandes", "/facturation"], more: true },
  doctor: { hrefs: ["/dashboard/doctor", "/patients", "/demandes", "/resultats"], more: true },
  technician: { hrefs: ["/dashboard/technician", "/scanner", "/prelevements", "/resultats"], more: true },
  laborant: { hrefs: ["/dashboard/technician", "/scanner", "/prelevements", "/resultats"], more: true },
  receptionist: {
    hrefs: ["/dashboard/receptionist", "/patients", "/visites", "/scanner", "/demandes"],
    more: false,
  },
  viewer: { hrefs: ["/dashboard/viewer", "/patients", "/analyses", "/resultats"], more: true },
};

const ITEMS_BY_HREF = new Map<string, NavItem>();
for (const section of ALL_SECTIONS) {
  for (const item of section.items) {
    if (!ITEMS_BY_HREF.has(item.href)) ITEMS_BY_HREF.set(item.href, item);
  }
}

const isDashboardHref = (href: string) => href.startsWith("/dashboard");

export function BottomNav({ onMore }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const primaryRole = user?.roles?.[0] || "viewer";
  const spec = ROLE_NAV[primaryRole] || ROLE_NAV.viewer;

  const items = React.useMemo(
    () =>
      spec.hrefs
        .map((href) => ITEMS_BY_HREF.get(href))
        .filter((item): item is NavItem => Boolean(item)),
    [spec]
  );

  const isActive = (href: string) =>
    isDashboardHref(href)
      ? pathname === href || pathname.startsWith("/dashboard")
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-12px_rgba(15,27,51,0.25)] lg:hidden print:hidden"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors",
                  active ? "text-[#3D9597]" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="h-[22px] w-[22px] shrink-0" />
                <span className={cn("max-w-full text-center leading-tight", active && "font-semibold")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
        {spec.more ? (
          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onMore}
              aria-label="Plus de navigation"
              className="flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-medium leading-tight text-slate-500 transition-colors hover:text-slate-700"
            >
              <Menu className="h-[22px] w-[22px] shrink-0" />
              <span className="max-w-full text-center leading-tight">Plus</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

export default BottomNav;
