"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { useLab } from "@/components/lab/LabProvider";
import { api, toList } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonTableRow, SkeletonCard } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Search,
  Filter,
  FileText,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  laboratory_id: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  login: "Connexion",
  logout: "Déconnexion",
  validate: "Validation",
  deliver: "Remise",
  "send-to-lab": "Envoi au laboratoire",
  print: "Impression",
  export: "Export",
  import: "Import",
  generate: "Génération",
  upload: "Téléversement",
  download: "Téléchargement",
  "change-password": "Modification du mot de passe",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function shortId(value: string | null | undefined): string {
  if (!value) return "—";
  return value.length > 8 ? `${value.slice(0, 8)}…` : value;
}

export default function AuditPage() {
  const { user, hasPermission } = useAuth();
  useRoleGuard();

  const { activeLabId } = useLab();
  const laboratoryId = user?.laboratory_id ?? activeLabId;
  const canView = hasPermission("reports.view");

  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);

  const actions = React.useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) if (log.action) set.add(log.action);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (log.user_id ?? "").toLowerCase().includes(q) ||
      (log.action ?? "").toLowerCase().includes(q) ||
      (log.entity_type ?? "").toLowerCase().includes(q) ||
      (log.entity_id ?? "").toLowerCase().includes(q);
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const load = React.useCallback(async () => {
    if (!laboratoryId) {
      setLogs([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const requestedLimit = Math.min(limit, 100);
      const res = await api.safeGet<AuditLog[]>(
        `/reports/audit?laboratory_id=${encodeURIComponent(laboratoryId)}&page=${page}&limit=${requestedLimit}`,
      );
      if (res.error) throw res.error;
      const next = toList<AuditLog>(res.data);
      setLogs(next);
      setHasMore(next.length === requestedLimit);
    } catch (err: any) {
      setError(err?.message || "Chargement du journal d'audit impossible");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [laboratoryId, page, limit]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [laboratoryId, search, actionFilter, limit]);

  return (
    <div className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Journal d'audit"
        description="Toutes les opérations importantes sont journalisées"
      />

      {!laboratoryId ? (
        <Alert variant="destructive">
          <AlertDescription>
            Aucun laboratoire n&apos;est associé à votre compte : le journal d'audit ne peut pas être chargé.
          </AlertDescription>
        </Alert>
      ) : null}

      {!canView ? (
        <Alert>
          <AlertDescription>
            Vous ne disposez pas de la permission <code className="font-mono text-xs">reports.view</code> pour consulter le journal d'audit.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Réessayer
          </Button>
        </Alert>
      ) : null}

      {laboratoryId && canView && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F7F9FA] rounded-lg border border-[#E5E7EB] p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground">Rechercher</span>
              <Input
                id="audit-search"
                placeholder="Utilisateur, action ou entité…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <SelectLabel className="text-xs font-medium text-muted-foreground">
                Action
              </SelectLabel>
              <Select
                value={actionFilter}
                onValueChange={setActionFilter}
              >
                <SelectTrigger id="audit-action" className="w-full sm:w-56">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Actions détectées</SelectLabel>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabel(action)}
                    </SelectItem>
                  ))}
                  {actions.length === 0 && (
                    <SelectItem value="" disabled className="text-muted-foreground">
                      Aucune action
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground">Par page</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  const n = Number(value);
                  if (!Number.isNaN(n) && n > 0) setLimit(Math.min(n, 100));
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonTableRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 sm:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="Aucune opération enregistrée"
              description="Aucune opération importante n'a encore été journalisée pour ce laboratoire."
              action={
                <Button onClick={() => void load()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" /> Réessayer
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-24">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Entité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-32">Identifiant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border hover:bg-[#F7F9FA]/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {log.user_id ? shortId(log.user_id) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[11px] leading-none">
                            {actionLabel(log.action)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {log.entity_type || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 truncate">
                          {log.entity_id || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 sm:hidden">
                {filtered.map((log) => (
                  <div
                    key={log.id}
                    className="min-h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white p-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {actionLabel(log.action)}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          {formatDateTime(log.created_at)}
                          <span className="text-slate-400">·</span>
                          Utilisateur {shortId(log.user_id)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[11px] leading-none shrink-0">
                          {log.entity_type || "—"}
                        </Badge>
                        <span className="font-mono text-xs text-slate-400 shrink-0">
                          {log.entity_id || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Page {page}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}