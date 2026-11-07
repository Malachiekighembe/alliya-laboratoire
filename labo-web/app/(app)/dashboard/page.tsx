"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboard } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const roles = user.roles || [];
    const primaryRole = roles[0] || "viewer";
    const redirect = getRoleDashboard(primaryRole);

    // Only redirect if not already on the target dashboard
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith(redirect)) {
      router.replace(redirect);
    }
  }, [user, loading, router]);

  return null;
}
