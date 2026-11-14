"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import AppBar from "./AppBar";
import BottomNav from "./BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LabProvider } from "@/components/lab/LabProvider";
import { api } from "@/lib/api-client";
import type { Laboratory } from "@/lib/api-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user } = useAuth();
  const [laboratories, setLaboratories] = React.useState<Laboratory[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLaboratories([]); return; }
      try {
        if (user.roles?.includes("super_admin")) {
          const res = await api.safeGet<Laboratory[]>("/laboratories");
          if (!cancelled) setLaboratories(!res.error && Array.isArray(res.data) ? res.data : []);
        } else if (user.laboratory_id) {
          const res = await api.safeGet<Laboratory>(`/laboratories/${user.laboratory_id}`);
          if (!cancelled) setLaboratories(!res.error && res.data ? [res.data as Laboratory] : []);
        } else {
          if (!cancelled) setLaboratories([]);
        }
      } catch { if (!cancelled) setLaboratories([]); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <LabProvider user={user} laboratories={laboratories}>
      <div className="min-h-screen bg-[#F3F6FA]">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className={cn("min-h-screen flex flex-col transition-all duration-300 print:pl-0", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
          <AppBar onMenu={() => setMobileOpen(true)} collapsed={collapsed} />
          <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-10 print:p-0">
            {children}
          </motion.main>
        </div>
        <BottomNav onMore={() => setMobileOpen(true)} />
      </div>
    </LabProvider>
  );
}
export { Layout };
