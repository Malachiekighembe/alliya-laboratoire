"use client";
import { useAuth } from '@/hooks/useAuth';
import { useRoleGuard } from '@/lib/auth';

export default function RendezVousPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Non authentifié</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Rendez-vous</h1>
        <p className="text-sm text-muted-foreground">Visites et demandes d'analyses</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-10 text-center">
        <h2 className="text-base sm:text-lg font-semibold mb-2">Gestion des visites</h2>
        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm">Créez des passages, des demandes d'analyses et suivez le parcours patient.</p>
        {hasPermission('visits.create') && <button className="inline-flex items-center justify-center rounded-xl bg-[#1E2A47] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162544] w-full sm:w-auto">+ Nouvelle visite</button>}
      </div>
    </div>
  );
}
