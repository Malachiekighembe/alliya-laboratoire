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

const COMMON = ["/dashboard", "/profil"];

const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  super_admin: [
    ...COMMON,
    "/dashboard/super-admin",
    "/admin",
    "/admin/laboratoires",
    "/admin/abonnements",
"/admin/utilisateurs",
    "/catalogue",
    "/demandes",
    "/parametres",
    "/personnel",
  ],
admin: [
    ...COMMON,
    "/dashboard/lab-admin",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/demandes",
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
    ...COMMON,
    "/dashboard/lab-admin",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/demandes",
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
    ...COMMON,
    "/dashboard/lab-admin",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/demandes",
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
    ...COMMON,
    "/dashboard/doctor",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/resultats",
    "/validations",
    "/visites",
    "/demandes",
    "/rendez-vous",
    "/rapports",
  ],
  technician: [
    ...COMMON,
    "/dashboard/technician",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/demandes",
    "/resultats",
    "/prelevements",
    "/parametres",
  ],
  receptionist: [
    ...COMMON,
    "/dashboard/receptionist",
    "/scanner",
    "/patients",
    "/visites",
    "/demandes",
    "/catalogue",
    "/rendez-vous",
    "/facturation",
  ],
  laborant: [
    ...COMMON,
    "/dashboard/laborant",
    "/scanner",
    "/patients",
    "/analyses",
    "/catalogue",
    "/demandes",
    "/resultats",
    "/prelevements",
  ],
  viewer: [
    ...COMMON,
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
    const allowed = ROLE_ALLOWED_ROUTES[primaryRole] || COMMON;

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

export function hasRolePermission(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((r) => userRoles.includes(r));
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrateur (Système)",
  admin: "Administrateur Labo",
  lab_manager: "Responsable Labo",
  DIR: "Directeur",
  doctor: "Médecin / Biologiste",
  technician: "Technicien",
  receptionist: "Réceptionniste",
  laborant: "Laborantin",
  viewer: "Lecteur",
};
