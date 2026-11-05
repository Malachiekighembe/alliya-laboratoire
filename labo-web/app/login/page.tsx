"use client";
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function ConnexionPage() {
  const { login, loading, error, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [laboratoryId, setLaboratoryId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    window.location.href = '/';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(laboratoryId, email, password);
      window.location.href = '/';
    } catch {
      // Erreur gerée par le hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-3"
              style={{ backgroundColor: '#3D9597' }}
            >
              A
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#07122E' }}>
              Alliya Labo
            </h1>
            <p className="text-muted-foreground mt-1">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">ID Laboratoire</label>
              <input
                name="laboratory_id"
                value={laboratoryId}
                onChange={(e) => setLaboratoryId(e.target.value)}
                className="input"
                placeholder="UUID du laboratoire"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded" />
                Se souvenir de moi
              </label>
              <a href="#" className="hover:underline" style={{ color: '#3D9597' }}>
                Mot de passe oublie ?
              </a>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-2 rounded-md transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#3D9597' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
