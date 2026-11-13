"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api, toList } from "@/lib/api-client";
import { useConfigurationOptions } from "@/lib/use-lab-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { TestFormDialog } from "@/components/forms/test-form-dialog";
import { FlaskConical, Pencil, Plus, Power, Search } from "lucide-react";

const EDIT_ROLES = ["admin", "super_admin", "lab_manager", "DIR"];

function options(items: any[] | undefined) {
  return (items ?? [])
    .filter((item: any) => item.is_active !== false)
    .map((item: any) => ({ value: String(item.code), label: String(item.label || item.code) }));
}

function labelOf(list: { value: string; label: string }[], value: string | null | undefined) {
  if (!value) return "—";
  return list.find((option) => option.value === value)?.label || value;
}

export default function CataloguePage() {
  const { user } = useAuth();
  useRoleGuard();

  const laboratoryId = user?.laboratory_id ?? null;
  const canEdit = !!user && EDIT_ROLES.some((role) => user.roles.includes(role));
  const { items } = useConfigurationOptions(laboratoryId);

  const examTypes = React.useMemo(() => options(items.exam_type), [items]);
  const sections = React.useMemo(() => options(items.section), [items]);
  const sampleTypes = React.useMemo(() => options(items.sample_type), [items]);

  const [tests, setTests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [examType, setExamType] = React.useState("");
  const [section, setSection] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    if (!laboratoryId) { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams({
      laboratory_id: laboratoryId,
      limit: "100",
      ...(search ? { search } : {}),
      ...(examType ? { exam_type: examType } : {}),
      ...(section ? { section } : {}),
      ...(showInactive ? { include_inactive: "true" } : {}),
    });
    try {
      const res = await api.get<any>(`/examinations?${params.toString()}`);
      setTests(toList(res.data));
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Chargement du catalogue impossible");
    } finally {
      setLoading(false);
    }
  }, [laboratoryId, search, examType, section, showInactive]);

  React.useEffect(() => { void load(); }, [load]);

  const toggle = async (test: any) => {
    try {
      await api.patch(`/examinations/${test.id}`, { is_active: !test.is_active });
      await load();
    } catch (err: any) {
      setError(err?.message || "Mise à jour impossible");
    }
  };

  const prices = tests.map((test) => Number(test.price)).filter((price) => Number.isFinite(price) && price > 0);
  const averagePrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue d'examens"
        description="Examens, tarifs et conditions de prélèvement — base des demandes et de la facturation"
        action={
          canEdit ? (
            <Button
              className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-2" /> Nouvel examen
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Examens" value={tests.length} icon={<FlaskConical className="h-5 w-5 text-alliya-turquoise-700" />} variant="default" />
        <StatCard label="Types d'examen" value={new Set(tests.map((test) => test.exam_type).filter(Boolean)).size} variant="outline" />
        <StatCard label="Sections" value={new Set(tests.map((test) => test.section).filter(Boolean)).size} variant="outline" />
        <StatCard label="Prix moyen" value={averagePrice ? averagePrice.toFixed(2) : "—"} variant="alliya-dark" />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Examens ({tests.length})</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-[#1E2A47] focus:outline-none focus:ring-2 focus:ring-[#1E2A47]/15"
                placeholder="Rechercher un code ou un examen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-[#1E2A47] focus:outline-none"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="">Tous les types d'examen</option>
              {examTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-[#1E2A47] focus:outline-none"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="">Toutes les sections</option>
              {sections.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Afficher les inactifs
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
          ) : tests.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Aucun examen ne correspond à la recherche.</p>
              {canEdit ? (
                <Button variant="outline" className="mt-3" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Créer le premier examen
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Examen</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Section</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Échantillon</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Prix</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Statut</th>
                    {canEdit ? <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2 font-mono text-xs">{test.code}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{test.name}</span>
                        {test.preparation ? (
                          <span className="block text-[11px] text-muted-foreground">Préparation : {test.preparation}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs">{labelOf(examTypes, test.exam_type)}</td>
                      <td className="px-3 py-2 text-xs">{labelOf(sections, test.section)}</td>
                      <td className="px-3 py-2 text-xs">{labelOf(sampleTypes, test.sample_type)}</td>
                      <td className="px-3 py-2 text-right text-xs">{test.price !== null && test.price !== undefined ? Number(test.price).toFixed(2) : "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={test.is_active ? "default" : "outline"} className={test.is_active ? "bg-success/10 text-success border-success/20" : undefined}>
                          {test.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      {canEdit ? (
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => { setEditing(test); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={test.is_active ? "Désactiver" : "Activer"} onClick={() => void toggle(test)}>
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        laboratoryId={laboratoryId}
        test={editing}
        onSaved={() => { void load(); }}
      />
    </div>
  );
}