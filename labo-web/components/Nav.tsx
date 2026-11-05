"use client";
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">Alliya</span> Labo
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/patients" className="text-sm font-medium hover:text-primary transition-colors">
                Patients
              </Link>
              <Link href="/rendez-vous" className="text-sm font-medium hover:text-primary transition-colors">
                Rendez-vous
              </Link>
              <Link href="/laboratoire" className="text-sm font-medium hover:text-primary transition-colors">
                Laboratoire
              </Link>
              <Link href="/facturation" className="text-sm font-medium hover:text-primary transition-colors">
                Facturation
              </Link>
              <span className="text-sm text-muted-foreground">
                {user.first_name} {user.last_name}
              </span>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
