"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [user, ready, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 text-sm">
        Chargement...
      </div>
    );
  }
  if (!user) return null;

  return <>{children}</>;
}
