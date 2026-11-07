"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FlaskConical, Mail, Lock, UserPlus, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [role, setRole] = React.useState("viewer");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const roles = [
    { value: "super_admin", label: "Super Administrateur" },
    { value: "admin", label: "Administrateur" },
    { value: "doctor", label: "Médecin" },
    { value: "technician", label: "Technicien" },
    { value: "receptionist", label: "Réceptionniste" },
    { value: "laborant", label: "Laborantin" },
    { value: "viewer", label: "Lecteur" },
    { value: "lab_manager", label: "Responsable laboratoire" },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role_ids: [role],
      });
      router.push("/login");
    } catch (err: any) {
      setError(err?.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-alliya-dark-900 via-alliya-dark-800 to-alliya-turquoise-900 p-6 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#3D9597]/5 rounded-full blur-[160px]" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-[#1E2A47]/40 rounded-full blur-[140px]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-[#1E2A47]/40 bg-[#14203A]/80 backdrop-blur-md overflow-hidden border border-[#1E2A47]/50">
          <CardHeader className="px-8 pt-8 pb-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-alliya-turquoise-500 text-white mb-5 shadow-xl shadow-[#3D9597]_0px_0px_15px_rgba(61,149,151,$($matches[1]/100))">
              <UserPlus className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-alliya-dark-50">
              Créer un<span className="text-alliya-turquoise-400"> compte</span>
            </CardTitle>
            <CardDescription className="text-alliya-turquoise-200 text-sm mt-2">
              Rejoignez Alliya Laboratoire
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-6 space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertTitle className="text-destructive text-sm font-semibold mb-1 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Erreur
                </AlertTitle>
                <AlertDescription className="text-destructive/90 text-xs">
                  {error}
                </AlertDescription>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-semibold text-alliya-dark-100 flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5 text-alliya-turquoise-300" />
                    Prénom
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="text-sm text-alliya-dark-50 placeholder:text-alliya-dark-300/70 bg-[#1E2A47]/50 border border-alliya-dark-500 focus:border-alliya-turquoise-400 focus:ring-1 ring-[#3D9597]/50 transition-all h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-semibold text-alliya-dark-100 flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5 text-alliya-turquoise-300" />
                    Nom
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                    className="text-sm text-alliya-dark-50 placeholder:text-alliya-dark-300/70 bg-[#1E2A47]/50 border border-alliya-dark-500 focus:border-alliya-turquoise-400 focus:ring-1 ring-[#3D9597]/50 transition-all h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-alliya-dark-100 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-alliya-turquoise-300" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domaine.com"
                  className="text-sm text-alliya-dark-50 placeholder:text-alliya-dark-300/70 bg-[#1E2A47]/50 border border-alliya-dark-500 focus:border-alliya-turquoise-400 focus:ring-1 ring-[#3D9597]/50 transition-all h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-alliya-dark-100 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-alliya-turquoise-300" />
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-sm text-alliya-dark-50 placeholder:text-alliya-dark-300/70 bg-[#1E2A47]/50 border border-alliya-dark-500 focus:border-alliya-turquoise-400 focus:ring-1 ring-[#3D9597]/50 transition-all h-11 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-alliya-dark-300 group-hover:text-alliya-turquoise-400 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-alliya-dark-100">
                  Rôle
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-[#1E2A47]/50 border border-alliya-dark-500 text-alliya-dark-50 text-sm rounded-xl focus:border-alliya-turquoise-400 focus:ring-1 focus:ring-alliya-turquoise-400 block w-full p-2.5"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-alliya-turquoise-500 hover:bg-alliya-turquoise-400 text-alliya-dark-900 font-semibold py-3.5 rounded-xl shadow-lg shadow-[#3D9597]_0px_0px_15px_rgba(61,149,151,$($matches[1]/100)) transition-all active:scale-[0.97] text-sm tracking-wide"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-sm">Création…</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="font-semibold text-sm">Créer le compte</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <div className="border-t border-[#1E2A47]/30 px-8 py-5 bg-[#0B172C]/30">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alliya-dark-950 border border-alliya-dark-700">
                <span className="text-[10px] font-bold text-alliya-turquoise-300">AL</span>
              </div>
              <p className="text-[10px] text-alliya-dark-400 leading-tight">
                Déjà un compte ?
                <a href="/login" className="text-alliya-turquoise-300 font-semibold hover:text-alliya-turquoise-200">
                  Connectez-vous
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

