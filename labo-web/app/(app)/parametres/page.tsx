"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { useLab } from "@/components/lab/LabProvider";
import { api } from "@/lib/api-client";
import { useConfigurationCategories } from "@/lib/use-lab-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ConfigurationItemFormDialog,
  type ConfigurationItem,
} from "@/components/forms/configuration-item-form-dialog";
import { Pencil, Plus, RotateCcw, Trash2, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EDIT_ROLES = ["admin", "super_admin", "lab_manager"];

export default function ParametresPage() {
  const { user } = useAuth();
  useRoleGuard();

  // Un super administrateur n'a pas de laboratoire par défaut : on retombe sur
  // le laboratoire actif sélectionné dans la barre latérale.
  const { activeLabId } = useLab();
  const laboratoryId = user?.laboratory_id ?? activeLabId;
  const canEdit = !!user && EDIT_ROLES.some((role) => user.roles.includes(role));
  const { categories, loading: loadingCategories } = useConfigurationCategories();

  const [items, setItems] = React.useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ConfigurationItem | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!laboratoryId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/configuration?laboratory_id=${laboratoryId}&include_inactive=1`);
      const data = res.data as any;
      setItems(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Chargement des paramètres impossible");
    } finally {
      setLoading(false);
    }
  }, [laboratoryId]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    if (!activeTab && categories.length) setActiveTab(categories[0].value);
  }, [categories, activeTab]);

  const seed = async (category: string) => {
    setSeeding(true);
    try {
      await api.post("/configuration/seed", { categories: [category] });
      await load();
    } catch (err: any) {
      setError(err?.message || "Initialisation impossible");
    } finally {
      setSeeding(false);
    }
  };

  const remove = async (item: ConfigurationItem) => {
    if (!window.confirm(`Désactiver « ${item.label} » ? L'historique reste consultable.`)) return;
    try {
      await api.delete(`/configuration/${item.id}`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Suppression impossible");
    }
  };

  const toggle = async (item: ConfigurationItem) => {
    try {
      await api.patch(`/configuration/${item.id}`, { is_active: !item.is_active });
      await load();
    } catch (err: any) {
      setError(err?.message || "Mise à jour impossible");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Listes de référence du laboratoire : examens, frais, échantillons, unités et documents"
        action={
          canEdit ? (
            <Button
              className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              disabled={!activeTab}
            >
              <Plus className="h-4 w-4 mr-2" /> Nouvel item
            </Button>
          ) : undefined
        }
      />

      {!laboratoryId ? (
        <Alert>
          <AlertDescription>
            Aucun laboratoire n&apos;est associé à votre compte : les paramètres ne peuvent pas être chargés.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {categories.length === 0 && !loadingCategories ? (
        <Alert>
          <AlertDescription>
            Aucune catégorie de paramétrage disponible. Vérifiez la connexion au serveur.
          </AlertDescription>
        </Alert>
      ) : null}

      {categories.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value} className="whitespace-nowrap">
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const rows = items.filter((item) => item.category === category.value);
            return (
              <TabsContent key={category.value} value={category.value} className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">
                      {category.label} <span className="text-muted-foreground">({rows.length})</span>
                    </CardTitle>
                    {canEdit ? (
                      <Button variant="outline" size="sm" onClick={() => void seed(category.value)} disabled={seeding}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Initialiser les valeurs par défaut
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <>
                        <div className="space-y-2 sm:hidden">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                          ))}
                        </div>
                        <p className="hidden py-8 text-center text-sm text-muted-foreground sm:block">Chargement…</p>
                      </>
                    ) : rows.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <p>Aucun élément configuré pour cette catégorie.</p>
                        {canEdit ? (
                          <p className="mt-1 text-xs">
                            Cliquez sur « Initialiser les valeurs par défaut » ou ajoutez un élément.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <>
                      <div className="space-y-2 sm:hidden">
                        {rows.map((item) => {
                          const cardInteractive = canEdit
                            ? {
                                role: "button" as const,
                                tabIndex: 0,
                                onClick: () => { setEditing(item); setDialogOpen(true); },
                                onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
                                  if (event.target !== event.currentTarget) return;
                                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setEditing(item); setDialogOpen(true); }
                                },
                              }
                            : {};
                          return (
                            <div
                              key={item.id}
                              {...cardInteractive}
                              className="min-h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white p-3 transition-colors hover:border-[#3D9597]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-xs font-semibold text-slate-800">{item.code}</span>
                                    {item.is_default ? <Badge variant="secondary" className="text-[10px]">défaut</Badge> : null}
                                    <Badge variant={item.is_active ? "default" : "outline"} className={item.is_active ? "bg-success/10 text-success border-success/20 text-[10px]" : "text-[10px]"}>
                                      {item.is_active ? "Actif" : "Inactif"}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 truncate text-sm font-medium text-slate-900">{item.label}</p>
                                  {item.description ? (
                                    <p className="mt-0.5 text-[11px] text-slate-500">{item.description}</p>
                                  ) : null}
                                </div>
                                <p className="shrink-0 text-[11px] text-slate-500">
                                  {item.price ? `${item.price} ${item.unit || ""}`.trim() : item.unit || "—"}
                                </p>
                              </div>
                              {canEdit ? (
                                <div className="mt-2 flex items-center justify-end gap-1 border-t border-[#E5E7EB] pt-2">
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); void toggle(item); }}>
                                    {item.is_active ? "Désactiver" : "Activer"}
                                  </Button>
                                  <Button variant="ghost" size="icon" aria-label="Modifier" onClick={(e) => { e.stopPropagation(); setEditing(item); setDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={(e) => { e.stopPropagation(); void remove(item); }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Libellé</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Détail</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Statut</th>
                              {canEdit ? <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Actions</th> : null}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((item) => (
                              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.label}</span>
                                    {item.is_default ? <Badge variant="secondary" className="text-[10px]">défaut</Badge> : null}
                                  </div>
                                  {item.description ? (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {item.price ? `${item.price} ${item.unit || ""}`.trim() : item.unit || "—"}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant={item.is_active ? "default" : "outline"} className={item.is_active ? "bg-success/10 text-success border-success/20" : undefined}>
                                    {item.is_active ? "Actif" : "Inactif"}
                                  </Badge>
                                </td>
                                {canEdit ? (
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => void toggle(item)}>
                                        {item.is_active ? "Désactiver" : "Activer"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Modifier"
                                        onClick={() => { setEditing(item); setDialogOpen(true); }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => void remove(item)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : null}

      <Card href="/parametres/audit" className="border border-[#E5E7EB]">
        <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1E2A47]" /> Journal d'audit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          <p className="text-sm text-muted-foreground">Consultez le journal des opérations importantes du laboratoire.</p>
        </CardContent>
      </Card>

      <ConfigurationItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={activeTab}
        item={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}