"use client";
import { useAuth } from '../../hooks/useAuth';

export default function LaboratoirePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Laboratoire</h1>
          <p className="text-sm text-muted-foreground">Prélèvements, résultats et validation</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-1">Prélèvements</h3>
            <p className="text-sm text-muted-foreground">Enregistrement et suivi des échantillons</p>
            {hasPermission('specimens.create') && <button className="btn-primary mt-4">+ Nouveau prélèvement</button>}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-1">Résultats</h3>
            <p className="text-sm text-muted-foreground">Saisie et validation des résultats</p>
            {hasPermission('results.create') && <button className="btn-primary mt-4">+ Saisir résultat</button>}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-1">Validation</h3>
            <p className="text-sm text-muted-foreground">Résultats en attente de validation</p>
            {hasPermission('results.validate') && <button className="btn-primary mt-4">Voir validations</button>}
          </div>
        </div>
      </main>
    </div>
  );
}