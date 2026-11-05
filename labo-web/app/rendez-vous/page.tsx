"use client";
import { useAuth } from '../../hooks/useAuth';

export default function RendezVousPage() {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Non authentifié</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Rendez-vous</h1>
          <p className="text-sm text-muted-foreground">Visites et demandes d'analyses</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Gestion des visites</h2>
          <p className="text-muted-foreground mb-6">
            Créez des passages, des demandes d'analyses et suivez le parcours patient.
          </p>
          {hasPermission('visits.create') && (
            <button className="btn-primary">+ Nouvelle visite</button>
          )}
        </div>
      </main>
    </div>
  );
}