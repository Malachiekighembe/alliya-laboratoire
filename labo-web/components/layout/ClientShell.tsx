"use client";

import { usePathname } from "next/navigation";
import { Layout } from "@/components/layout/Layout";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuth) {
    return <div className="min-h-screen">{children}</div>;
  }

  return <Layout>{children}</Layout>;
}
