import * as React from "react";
import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "info" | "destructive" | "alliya-dark" | "alliya-turquoise" }> = {
  // Results / analyses
  pending: { label: "En attente", variant: "warning" },
  en_attente: { label: "En attente", variant: "warning" },
  validated: { label: "Valide", variant: "success" },
  valide: { label: "Valide", variant: "success" },
  in_progress: { label: "En cours", variant: "info" },
  en_cours: { label: "En cours", variant: "info" },
  collected: { label: "Prélèvement effectué", variant: "info" },
  prelevement_effectue: { label: "Prélèvement effectué", variant: "info" },
  demanded: { label: "Demandée", variant: "outline" },
  demandee: { label: "Demandée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
  annulee: { label: "Annulée", variant: "destructive" },
  // Invoices / payments
  paid: { label: "Payée", variant: "success" },
  payee: { label: "Payée", variant: "success" },
  unpaid: { label: "Non payée", variant: "warning" },
  non_payee: { label: "Non payée", variant: "warning" },
  overdue: { label: "En retard", variant: "destructive" },
  en_retard: { label: "En retard", variant: "destructive" },
  draft: { label: "Brouillon", variant: "secondary" },
  brouillon: { label: "Brouillon", variant: "secondary" },
  // General
  active: { label: "Actif", variant: "success" },
  inactive: { label: "Inactif", variant: "secondary" },
  published: { label: "Publié", variant: "success" },
  publie: { label: "Publié", variant: "success" },
  // Priority
  high: { label: "Élevée", variant: "destructive" },
  elevee: { label: "Élevée", variant: "destructive" },
  normal: { label: "Normale", variant: "default" },
  normale: { label: "Normale", variant: "default" },
  low: { label: "Faible", variant: "secondary" },
  faible: { label: "Faible", variant: "secondary" },
  // Alliablue status
  verified: { label: "Vérifié", variant: "alliya-dark" },
  approuve: { label: "Approuvé", variant: "alliya-dark" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status] || { label: status.replace(/_/g, " "), variant: "outline" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.variant === "success" && "bg-success/15 text-success",
        cfg.variant === "warning" && "bg-warning/15 text-warning",
        cfg.variant === "info" && "bg-info/15 text-info",
        cfg.variant === "destructive" && "bg-destructive/15 text-destructive",
        cfg.variant === "secondary" && "bg-muted text-muted-foreground",
        cfg.variant === "outline" && "border border-input text-foreground",
        cfg.variant === "default" && "bg-primary/10 text-primary",
        cfg.variant === "alliya-dark" && "bg-alliya-dark-100 text-alliya-dark-700",
        cfg.variant === "alliya-turquoise" && "bg-alliya-turquoise-100 text-alliya-turquoise-700",
        className
      )}
    >
      {cfg.label}
    </span>
  );
}