"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center items-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E2A47]/5 text-[#1E2A47]">
            <WifiOff className="h-7 w-7" />
          </div>
          <CardTitle className="text-[#1E2A47]">Vous êtes hors ligne</CardTitle>
          <CardDescription>
            La connexion au réseau est indisponible. Les pages déjà consultées peuvent rester accessibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-sm text-slate-600 text-center">
            Vos actions seront enregistrées puis synchronisées automatiquement dès le retour de la connexion.
          </p>
          <Button
            variant="turquoise"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

