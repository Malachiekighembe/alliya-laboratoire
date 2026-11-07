"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LabProvider } from "@/components/lab/LabProvider";
import { supabaseDb } from "@/lib/supabase";
import type { Laboratory } from "@/lib/api-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [laboratories, setLaboratories] = React.useState<Laboratory[]>([]);

  React.useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token && !pathname.startsWith("/login")) {
      router.replace("/login");
    }
  }, [pathname, router]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        if (user.roles.includes("super_admin")) {
          const res = await supabaseDb.getLaboratories();
          if (!cancelled) setLaboratories(Array.isArray(res.data) ? res.data : []);
        } else if (user.laboratory_id) {
          const res = await supabaseDb.getLaboratory(user.laboratory_id);
          if (!cancelled && res.data) setLaboratories([res.data]);
        }
      } catch {
        if (!cancelled) setLaboratories([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <LabProvider user={user} laboratories={laboratories}>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "flex min-h-screen flex-col transition-all duration-300",
            collapsed ? "lg:pl-[64px]" : "lg:pl-64"
          )}
        >
          <header
            className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Alliya Labo
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-alliya-turquoise-700" />
                  <span className="truncate max-w-[140px] text-alliya-dark-700">
                    {user.roles[0] || "Utilisateur"}
                  </span>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </LabProvider>
  );
}

export { Layout };

