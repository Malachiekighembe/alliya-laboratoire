"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSubsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/parametres");
  }, [router]);
  return null;
}
