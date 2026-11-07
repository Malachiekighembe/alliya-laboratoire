import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ROLE_ROUTES: Record<string, string> = {
  super_admin: "/admin",
  admin: "/dashboard/lab-admin",
  doctor: "/dashboard/doctor",
  technician: "/dashboard/technician",
  receptionist: "/dashboard/receptionist",
  laborant: "/dashboard/laborant",
  viewer: "/dashboard/viewer",
};

const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  super_admin: [
    "/dashboard",
    "/dashboard/super-admin",
    "/admin",
    "/admin/laboratoires",
    "/admin/utilisateurs",
    "/admin/abonnements",
    "/parametres",
  ],
  admin: [
    "/dashboard",
    "/dashboard/lab-admin",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/analyses",
    "/resultats",
    "/rendez-vous",
    "/laboratoire",
    "/personnel",
    "/facturation",
    "/parametres",
    "/rapports",
  ],
  doctor: [
    "/dashboard",
    "/dashboard/doctor",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/analyses",
    "/resultats",
  ],
  technician: [
    "/dashboard",
    "/dashboard/technician",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/analyses",
    "/resultats",
  ],
  receptionist: [
    "/dashboard",
    "/dashboard/receptionist",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/rendez-vous",
  ],
  laborant: [
    "/dashboard",
    "/dashboard/laborant",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/analyses",
    "/resultats",
  ],
  viewer: [
    "/dashboard",
    "/dashboard/viewer",
    "/patients",
    "/patients/nouveau",
    "/patients/dossiers",
    "/analyses",
    "/resultats",
  ],
};

export function useRoleGuard() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const roles = user.roles || [];
    const primaryRole = roles[0] || "viewer";
    const allowed = ROLE_ALLOWED_ROUTES[primaryRole] || [];

    const currentPath = pathname;

    const isAllowed =
      allowed.some((route) => currentPath.startsWith(route)) ||
      currentPath === "/dashboard";

    if (!isAllowed) {
      const redirect = ROLE_ROUTES[primaryRole] || "/dashboard/viewer";
      window.location.replace(redirect);
    }
  }, [user, pathname]);
}

export function getRoleDashboard(role: string): string {
  return ROLE_ROUTES[role] || "/dashboard/viewer";
}

export function hasRolePermission(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.some((r) => userRoles.includes(r));
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrateur",
  admin: "Administrateur",
  doctor: "Médecin",
  technician: "Technicien",
  receptionist: "Réceptionniste",
  laborant: "Laborantin",
  viewer: "Lecteur",
};
