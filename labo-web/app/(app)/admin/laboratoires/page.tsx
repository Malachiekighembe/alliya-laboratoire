"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLabsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/super-admin");
  }, [router]);
  return null;
}
