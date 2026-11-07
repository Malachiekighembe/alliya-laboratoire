"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ChevronRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-alliya-dark-900 via-alliya-dark-800 to-alliya-dark-900 p-4 overflow-hidden">
      {/* Décorations subtiles */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#3D9597]/10 rounded-full blur-[160px]" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-[#1E2A47]/30 rounded-full blur-[140px]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-border/50 bg-card overflow-hidden border border-border">
          <CardHeader className="px-8 pt-8 pb-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-alliya-turquoise text-white mb-6 shadow-lg shadow-[#3D9597]/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Alliya<span className="text-alliya-turquoise-700"> Laboratoire</span>
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Système de gestion de laboratoire biomédical
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertTitle>Erreur de connexion</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-alliya-turquoise-700" />
                  Identifiant
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@domaine.com ou téléphone"
                  className="text-sm placeholder:text-muted-foreground bg-background border border-input focus:border-alliya-turquoise focus:ring-2 focus:ring-[#3D9597]/20 transition-all h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-alliya-turquoise-700" />
                    Mot de passe
                  </Label>
                  <a href="#" className="text-xs text-alliya-turquoise-700 font-medium hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-sm placeholder:text-muted-foreground bg-background border border-input focus:border-alliya-turquoise focus:ring-2 focus:ring-[#3D9597]/20 transition-all h-11 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-alliya-turquoise-700 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-alliya-dark-500 text-alliya-turquoise-700 focus:ring-alliya-turquoise-700 bg-background h-3.5 w-3.5"
                  />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide active:scale-[0.97] shadow-lg shadow-[#3D9597]/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-sm">Connexion…</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-semibold text-sm">Se connecter</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <div className="border-t border-border px-8 py-5 bg-muted/30">
            <div className="flex items-center justify-between gap-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border">
                <span className="text-[10px] font-bold text-alliya-dark-700">AL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Nouveau ici ?</span>
                <a href="/register" className="text-[10px] text-alliya-turquoise-700 font-semibold hover:underline">
                  Créer un compte
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
