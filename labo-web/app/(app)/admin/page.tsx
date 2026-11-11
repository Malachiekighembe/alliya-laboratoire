"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    if (user.roles?.includes("super_admin")) {
      router.replace("/admin/laboratoires");
    } else {
      router.replace("/dashboard/lab-admin");
    }
  }, [router, user]);
  return null;
}
