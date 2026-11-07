"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="relative w-full max-w-md z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3D9597]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3D9597]/8 rounded-full blur-[120px]" />

        <Card className="shadow-2xl border-border/30 bg-white overflow-hidden border border-border/50">
          <CardHeader className="px-8 pt-10 pb-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3D9597]/10 text-[#3D9597] mb-6 shadow-sm mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Alliya<span className="text-[#3D9597]"> Laboratoire</span>
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Connexion à votre espace laboratoire
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertTitle>Erreur de connexion</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="font-medium flex items-center gap-2 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-[#3D9597]" />
                  Identifiant
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@domaine.com ou téléphone"
                  className="text-sm placeholder:text-muted-foreground bg-background border border-input focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/20 transition-all h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium flex items-center gap-2 text-foreground">
                    <Lock className="h-3.5 w-3.5 text-[#3D9597]" />
                    Mot de passe
                  </Label>
                  <a href="#" className="text-xs text-[#3D9597] font-medium hover:underline">
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
                    className="pl-10 pr-10 text-sm placeholder:text-muted-foreground bg-background border border-input focus:border-[#3D9597] focus:ring-2 focus:ring-[#3D9597]/20 transition-all h-11 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#3D9597] transition-colors"
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
                    className="rounded border-[#3D9597] text-[#3D9597] focus:ring-[#3D9597] bg-background h-3.5 w-3.5"
                  />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#3D9597] text-white hover:bg-[#2E7A7C] active:scale-[0.97] shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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

          <div className="border-t border-border px-8 py-6 bg-[#FAFAFA]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-border">
                <span className="text-[10px] font-bold text-slate-600">AL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Nouveau ici ?</span>
                <Link href="/register" className="text-[10px] text-[#3D9597] font-semibold hover:underline">
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
