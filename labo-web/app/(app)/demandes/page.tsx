"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/lib/auth";
import { api, toList } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderFormDialog } from "@/components/forms/order-form-dialog";
import { ClipboardList, Plus, Search, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CREATE_ROLES = ["admin", "super_admin", "lab_manager", "DIR", "receptionist", "doctor"];
const SEND_ROLES = ["admin", "super_admin", "lab_manager", "DIR", "receptionist"];

const PENDING_STATUSES = ["en_attente", "acceptee"];

export default function DemandesPage() {
  const { user } = useAuth();
  useRoleGuard();

  const laboratoryId = user?.laboratory_id ?? null;
  const canCreate = !!user && CREATE_ROLES.some((role) => user.roles.includes(role));
  const canSend = !!user && SEND_ROLES.some((role) => user.roles.includes(role));

  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [sending, setSending] = React.useState<string | null>(null);
  const [optimisticRows, setOptimisticRows] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    if (!laboratoryId) { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams({
      laboratory_id: laboratoryId,
      limit: "100",
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
    try {
      const res = await api.get<any>(`/orders?${params.toString()}`);
      setOrders(toList(res.data));
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Chargement des demandes impossible");
    } finally {
      setLoading(false);
    }
  }, [laboratoryId, search, status]);

  React.useEffect(() => { void load(); }, [load]);

  const sendToLab = async (order: any) => {
    setSending(order.id);
    try {
      await api.post(`/orders/${order.id}/send-to-lab`, {});
      await load();
      setSelected(null);
    } catch (err: any) {
      setError(err?.message || "Envoi au laboratoire impossible");
    } finally {
      setSending(null);
    }
  };

  const displayed = React.useMemo(() => {
    if (!optimisticRows.length) return orders;
    const ids = new Set(orders.map((o) => o.id));
    return [...optimisticRows.filter((row) => !ids.has(row.id)), ...orders];
  }, [orders, optimisticRows]);

  const patientName = (order: any) =>
    [order.patient?.first_name, order.patient?.last_name].filter(Boolean).join(" ") || "—";

  const totalOf = (order: any) => Number(order.total_price ?? 0);

  const stats = {
    total: displayed.length,
    pending: displayed.filter((order) => PENDING_STATUSES.includes(order.status)).length,
    running: displayed.filter((order) => order.status === "en_cours").length,
    revenue: displayed
      .filter((order) => !["annulee"].includes(order.status))
      .reduce((sum, order) => sum + totalOf(order), 0),
  };

  const detailFields = (order: any) => {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    return [
      { label: "Patient", value: patientName(order) },
      { label: "Matricule patient", value: order.patient?.matricule, mono: true },
      { label: "Date", value: order.order_date ? new Date(order.order_date).toLocaleString("fr-FR") : "—" },
      { label: "Statut", value: <StatusBadge status={order.status} /> },
      { label: "Priorité", value: order.priority || "normale" },
      { label: "Visite", value: order.visit?.matricule || "—" },
      {
        label: `Examens (${items.length})`,
        wide: true,
        value: items.length ? (
          <ul className="space-y-1">
            {items.map((item: any) => (
              <li key={item.id} className="flex justify-between gap-3 text-xs">
                <span>{item.name || item.code || item.test_catalog_id}</span>
                <span className="shrink-0 text-muted-foreground">
                  {item.quantity ?? 1} × {Number(item.unit_price ?? 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          "—"
        ),
      },
      { label: "Total", value: totalOf(order).toFixed(2) },
      { label: "Notes", value: order.notes, wide: true },
    ];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d'examens"
        description="Prescriptions, suivi et envoi au laboratoire"
        action={
          canCreate ? (
            <Button className="!bg-[#1E2A47] !text-white hover:!bg-[#162544]" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle demande
            </Button>
          ) : undefined
        }
      />

      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Demandes" value={stats.total} icon={<ClipboardList className="h-5 w-5 text-alliya-turquoise-700" />} variant="default" />
        <StatCard label="En attente" value={stats.pending} variant="outline" />
        <StatCard label="En cours" value={stats.running} variant="outline" />
        <StatCard label="Montant" value={stats.revenue.toFixed(2)} variant="alliya-dark" />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Toutes les demandes ({displayed.length})</CardTitle>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-[#1E2A47] focus:outline-none focus:ring-2 focus:ring-[#1E2A47]/15"
                placeholder="Matricule, patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-[#1E2A47] focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="acceptee">Acceptée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
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
          ) : displayed.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune demande enregistrée.</p>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {displayed.map((order) => {
                  const count = Array.isArray(order.order_items) ? order.order_items.length : 0;
                  return (
                    <div
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(order)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(order); }
                      }}
                      className="min-h-[44px] w-full cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-3 transition-colors hover:border-[#3D9597]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-xs font-semibold text-slate-800">{order.matricule}</span>
                            <StatusBadge status={order._pending ? "en_attente" : order.status} className="shrink-0 text-[10px]" />
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-slate-900">{patientName(order)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString("fr-FR") : "—"}
                            {" · "}{count} examen{count > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[#1E2A47]">{totalOf(order).toFixed(2)}</p>
                          {canSend && PENDING_STATUSES.includes(order.status) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 h-8"
                              disabled={sending === order.id}
                              onClick={(e) => { e.stopPropagation(); void sendToLab(order); }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" /> Laboratoire
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Matricule</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Patient</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Examens</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((order) => {
                    const count = Array.isArray(order.order_items) ? order.order_items.length : 0;
                    return (
                      <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2 font-mono text-xs">{order.matricule}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{patientName(order)}</span>
                          {order.patient?.matricule ? (
                            <span className="block font-mono text-[11px] text-muted-foreground">{order.patient.matricule}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-xs">{order.order_date ? new Date(order.order_date).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="px-3 py-2 text-center text-xs">{count}</td>
                        <td className="px-3 py-2"><StatusBadge status={order._pending ? "en_attente" : order.status} /></td>
                        <td className="px-3 py-2 text-right text-xs">{totalOf(order).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelected(order)}>Détail</Button>
                            {canSend && PENDING_STATUSES.includes(order.status) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={sending === order.id}
                                onClick={() => void sendToLab(order)}
                              >
                                <Send className="h-3.5 w-3.5 mr-1" /> Laboratoire
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <DetailDialog
        open={!!selected}
        onOpenChange={(next) => { if (!next) setSelected(null); }}
        title={selected ? `Demande ${selected.matricule}` : "Demande"}
        subtitle={selected ? patientName(selected) : undefined}
        badge={selected?.status ? <Badge variant="alliya-turquoise-outline" className="capitalize">{String(selected.status).replace(/_/g, " ")}</Badge> : undefined}
        fields={selected ? detailFields(selected) : []}
      />

      <OrderFormDialog
        open={open}
        onOpenChange={setOpen}
        laboratoryId={laboratoryId}
        onCreated={(created) => {
          if (created?.id) {
            setOptimisticRows((prev) => [{ ...created, _pending: true }, ...prev]);
          }
          void load();
        }}
      />
    </div>
  );
}