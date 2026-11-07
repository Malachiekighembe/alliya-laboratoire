"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function RapportsPage() {
  const { user } = useAuth();
  useRoleGuard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Rapports d'activité et statistiques du laboratoire"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rapports de laboratoire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Générez des rapports d'activité pour votre laboratoire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
