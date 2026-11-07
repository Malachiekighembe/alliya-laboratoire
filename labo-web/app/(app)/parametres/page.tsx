"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ParametresPage() {
  const { user } = useAuth();
  useRoleGuard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration du laboratoire et préférences"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Nom du laboratoire</p>
                <p className="text-sm text-muted-foreground">{user?.laboratory_id ? "Configuré" : "Non configuré"}</p>
              </div>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Plan d'abonnement</p>
                <p className="text-sm text-muted-foreground">Starter</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
