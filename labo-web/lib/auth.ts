import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ROLE_ROUTES: Record<string, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/lab-admin",
  lab_manager: "/dashboard/lab-admin",
  DIR: "/dashboard/lab-admin",
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
    "/parametres",
    "/personnel",
  ],
  admin: [
    "/dashboard",
    "/dashboard/lab-admin",
    "/patients",
    "/analyses",
    "/resultats",
    "/validations",
    "/visites",
    "/prelevements",
    "/rendez-vous",
    "/laboratoire",
    "/personnel",
    "/facturation",
    "/parametres",
    "/rapports",
  ],
  lab_manager: [
    "/dashboard",
    "/dashboard/lab-admin",
    "/patients",
    "/analyses",
    "/resultats",
    "/validations",
    "/visites",
    "/prelevements",
    "/rendez-vous",
    "/personnel",
    "/facturation",
    "/parametres",
    "/rapports",
  ],
  DIR: [
    "/dashboard",
    "/dashboard/lab-admin",
    "/patients",
    "/analyses",
    "/resultats",
    "/validations",
    "/visites",
    "/prelevements",
    "/rendez-vous",
    "/personnel",
    "/facturation",
    "/parametres",
    "/rapports",
  ],
  doctor: [
    "/dashboard",
    "/dashboard/doctor",
    "/patients",
    "/analyses",
    "/resultats",
    "/validations",
    "/visites",
    "/rendez-vous",
  ],
  technician: [
    "/dashboard",
    "/dashboard/technician",
    "/patients",
    "/analyses",
    "/resultats",
    "/prelevements",
  ],
  receptionist: [
    "/dashboard",
    "/dashboard/receptionist",
    "/patients",
    "/visites",
    "/rendez-vous",
  ],
  laborant: [
    "/dashboard",
    "/dashboard/laborant",
    "/patients",
    "/analyses",
    "/resultats",
    "/prelevements",
  ],
  viewer: [
    "/dashboard",
    "/dashboard/viewer",
    "/patients",
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
