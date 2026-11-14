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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FA] to-[#EEF7F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#07122E] via-[#1E2A47] to-[#3D9597] opacity-5 rounded-full blur-3xl transform translate-x-[-50%] translate-y-[-50%]"></div>
        
        <Card className="relative shadow-2xl border-[#E5E7EB] bg-white/95 backdrop-blur-sm overflow-hidden border border-[#E5E7EB]">
        <CardHeader className="px-8 pt-9 pb-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-white mb-5 shadow-md mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111827]">
            Alliya<span className="text-[#6B7280]"> Laboratoire</span>
          </CardTitle>
          <p className="text-[#6B7280] text-sm mt-1">
            Connexion à votre espace laboratoire
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-7 space-y-5">
          {error && (
            <Alert variant="destructive" className="text-xs border-[#FECACA] bg-[#FEF2F2]">
              <AlertTriangle className="h-3.5 w-3.5 mr-2 text-[#DC2626]" />
              <AlertTitle className="text-[#DC2626] font-semibold text-xs">Erreur de connexion</AlertTitle>
              <AlertDescription className="text-[#B91C1C] text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="font-medium text-sm text-[#374151] flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-[#6B7280]" />
                Identifiant
              </Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@domaine.com ou téléphone"
                className="text-sm placeholder:text-[#9CA3AF] bg-[#FAFAFA] border border-[#D1D5DB] focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/20 transition-all h-10 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium text-sm text-[#374151] flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-[#6B7280]" />
                  Mot de passe
                </Label>
                <button
                  type="button"
                  onClick={() => setShowHelp((v) => !v)}
                  className="text-[10px] text-[#6B7280] font-medium hover:underline hover:text-[#111827] transition-colors"
                  aria-expanded={showHelp}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10 text-sm placeholder:text-[#9CA3AF] bg-[#FAFAFA] border border-[#D1D5DB] focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/20 transition-all h-10 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] group-hover:text-[#111827] transition-colors"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {showHelp && (
                <p className="text-[10px] text-[#6B7280] bg-[#F0FAFA] border border-[#3D9597]/30 rounded-lg px-3 py-2 leading-relaxed">
                  Contactez l'administrateur de votre laboratoire pour réinitialiser votre mot de passe.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-[#111827] text-[#111827] focus:ring-[#111827] bg-[#FAFAFA] h-3 w-3"
                />
                <span className="text-[#6B7280]">Se souvenir de moi</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#111827] text-white hover:bg-[#374151] active:scale-[0.97] shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  <span className="font-semibold text-xs">Connexion…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="font-semibold text-xs">Se connecter</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <div className="border-t border-[#E5E7EB] px-8 py-6 bg-[#F9FAFB]">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#D1D5DB]">
              <span className="text-[10px] font-bold text-[#6B7280]">AL</span>
            </div>
          </div>
        </div>
        </Card>
      </div>
    </div>
  );
}
