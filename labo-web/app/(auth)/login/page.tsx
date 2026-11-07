"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;
const MotionButton = motion.button;

const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeIn: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const scaleIn: any = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

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
    <MotionDiv
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex min-h-screen items-center justify-center bg-white p-6"
    >
      <MotionDiv
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md z-10"
      >
        <Card className="shadow-xl border-white bg-white overflow-hidden border border-slate-200">
          <CardHeader className="px-8 pt-9 pb-4 text-center">
            <MotionDiv
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white mb-5 shadow-lg mx-auto"
            >
              <ShieldCheck className="h-6 w-6" />
            </MotionDiv>
            <MotionH1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Alliya<span className="text-slate-500"> Laboratoire</span>
            </MotionH1>
            <MotionP
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-slate-500 text-sm mt-1"
            >
              Connexion à votre espace laboratoire
            </MotionP>
          </CardHeader>

          <CardContent className="px-8 pb-7 space-y-5">
            {error && (
              <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="mb-1">
                <Alert variant="destructive" className="text-xs border-red-50 bg-red-50/30">
                  <AlertTriangle className="h-3.5 w-3.5 mr-2 text-red-600" />
                  <AlertTitle className="text-red-800 font-semibold text-xs">Erreur de connexion</AlertTitle>
                  <AlertDescription className="text-red-700 text-xs">{error}</AlertDescription>
                </Alert>
              </MotionDiv>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-1.5">
                <Label htmlFor="identifier" className="font-medium text-sm text-slate-800 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-slate-500" />
                  Identifiant
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@domaine.com"
                  className="text-sm placeholder:text-slate-400 bg-background border border-slate-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all h-10 rounded-lg"
                  required
                />
              </MotionDiv>

              <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium text-sm text-slate-800 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-slate-500" />
                    Mot de passe
                  </Label>
                  <a href="#" className="text-[10px] text-slate-500 font-medium hover:underline hover:text-slate-800 transition-colors">
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
                    className="pl-9 pr-10 text-sm placeholder:text-slate-400 bg-background border border-slate-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-200 transition-all h-10 rounded-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-700 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </MotionDiv>

              <MotionDiv variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between text-[10px]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-500 text-slate-700 focus:ring-slate-500 bg-background h-3 w-3"
                  />
                  <span className="text-slate-600">Se souvenir de moi</span>
                </label>
              </MotionDiv>

              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 active:scale-[0.97] shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <MotionDiv animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    <span className="font-semibold text-xs">Connexion…</span>
                  </MotionDiv>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="font-semibold text-xs">Se connecter</span>
                  </div>
                )}
              </MotionButton>
            </form>
          </CardContent>
        </Card>
      </MotionDiv>
    </MotionDiv>
  );
}
