"use client";

import { usePathname } from "next/navigation";
import { Layout } from "@/components/layout/Layout";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuth) {
    return <div className="min-h-screen bg-gradient-to-br from-[#F5F8FA] to-[#EEF7F7]">{children}</div>;
  }

  return <Layout>{children}</Layout>;
}
