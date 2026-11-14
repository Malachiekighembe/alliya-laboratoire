"use client";

import * as React from "react";
import { useRoleGuard } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Camera, CameraOff, Search, RotateCcw } from "lucide-react";

type QrResult = {
  matricule: string;
  type: string;
  container: string | null;
  status: string;
  collection_date: string | null;
  patient: {
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
    birth_date: string | null;
    gender: string | null;
  };
  order: { matricule: string; status: string } | null;
  results: { test_name: string; value: string | null; unit: string | null; status: string }[];
};

function extractToken(input: string): string {
  const v = input.trim();
  if (!v) return "";
  try {
    const url = new URL(v);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "qr");
    if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  } catch {
    // not a URL
  }
  return v;
}

export default function ScannerPage() {
  useRoleGuard();
  const scannerRef = React.useRef<any>(null);
  const regionId = React.useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const [scanning, setScanning] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<QrResult | null>(null);
  const lastTokenRef = React.useRef<string | null>(null);

  const stopCamera = React.useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState?.();
      // 2 = SCANNING, 3 = PAUSED (html5-qrcode Html5QrcodeScannerState)
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
      await scanner.clear?.();
    } catch {
      // ignore cleanup errors
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  const lookup = React.useCallback(async (raw: string) => {
    const token = extractToken(raw);
    if (!token) return;
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.safeGet<QrResult>(`/specimens/public/qr/${encodeURIComponent(token)}`);
      if (res.error || !res.data) {
        const msg = res.error?.message || "";
        if (/404|introuvable|not found/i.test(msg)) {
          setError("Échantillon introuvable");
        } else {
          setError(msg || "Échantillon introuvable");
        }
        setData(null);
      } else {
        await stopCamera();
        setData(res.data);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, stopCamera]);

  const startCamera = React.useCallback(async () => {
    if (scanning || starting) return;
    setCameraError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Caméra non disponible");
        return;
      }
      const mod = await import("html5-qrcode");
      const { Html5Qrcode } = mod as any;
      // ensure previous instance cleared
      if (scannerRef.current) {
        await stopCamera();
      }
      const scanner = new Html5Qrcode(regionId.current);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          const token = extractToken(decodedText);
          if (!token || token === lastTokenRef.current) return;
          lastTokenRef.current = token;
          void lookup(token);
        },
        () => { /* ignore scan failures */ }
      );
      setScanning(true);
    } catch (e: any) {
      const name = e?.name || "";
      const msg = String(e?.message || e || "");
      if (name === "NotAllowedError" || /permission|denied|notallowed/i.test(msg)) {
        setCameraError("Autorisation refusée");
      } else if (name === "NotFoundError" || /camera|device|not found|no camera/i.test(msg)) {
        setCameraError("Caméra non disponible");
      } else {
        setCameraError(/permission/i.test(msg) ? "Autorisation refusée" : "Caméra non disponible");
      }
      try { await scannerRef.current?.clear?.(); } catch {}
      scannerRef.current = null;
      setScanning(false);
    } finally {
      setStarting(false);
    }
  }, [lookup, scanning, starting, stopCamera]);

  React.useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const reset = React.useCallback(async () => {
    setData(null);
    setError(null);
    setManual("");
    lastTokenRef.current = null;
    await stopCamera();
  }, [stopCamera]);

  const onManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.trim()) return;
    lastTokenRef.current = null;
    await lookup(manual);
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("fr-FR"); } catch { return d; }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 sm:space-y-5">
      <PageHeader title="Scanner" description="Scanner un QR code d'échantillon ou saisir le matricule" />

      {!data && (
        <Card className="border border-[#E5E7EB]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2">
              <div
                id={regionId.current}
                className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F7F9FA]"
                style={{ minHeight: scanning ? 280 : 0 }}
              />
              {!scanning && !starting && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#F7F9FA] px-4 py-8 text-center text-sm text-slate-600">
                  <Camera className="mb-2 h-8 w-8 text-[#3D9597]" />
                  <p>Utilisez la caméra pour scanner un QR code.</p>
                </div>
              )}
              {starting && (
                <div className="flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F7F9FA] px-4 py-8 text-sm text-slate-600">
                  Démarrage de la caméra…
                </div>
              )}
              <div className="flex gap-2">
                {!scanning ? (
                  <Button
                    type="button"
                    onClick={startCamera}
                    disabled={starting}
                    className="h-11 flex-1 !bg-[#1E2A47] !text-white hover:!bg-[#162544]"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {starting ? "Démarrage…" : "Démarrer le scan"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void stopCamera()}
                    variant="outline"
                    className="h-11 flex-1"
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Arrêter la caméra
                  </Button>
                )}
              </div>
              {cameraError && (
                <Alert variant="destructive">
                  <AlertTitle>Caméra</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="border-t border-[#E5E7EB] pt-4">
              <form onSubmit={onManualSubmit} className="space-y-2">
                <Label htmlFor="manual-token">Saisir le matricule</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="manual-token"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder="LAB/ECH/2026/0001 ou jeton"
                    className="h-11 flex-1"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !manual.trim()}
                    className="h-11 !bg-[#3D9597] !text-white hover:!bg-[#2E7A7C] sm:min-w-[140px]"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Recherche…" : "Rechercher"}
                  </Button>
                </div>
              </form>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Recherche</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="border border-[#E5E7EB]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                <p className="text-lg font-semibold text-[#1E2A47]">
                  {(data.patient?.first_name || "") + " " + (data.patient?.last_name || "")}
                </p>
                <p className="text-sm text-slate-600">{data.patient?.matricule || "—"}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-lg bg-[#F7F9FA] p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Échantillon</p>
                <p className="font-medium text-[#1E2A47]">{data.matricule || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500">Type / contenant</p>
                <p className="font-medium text-[#1E2A47]">
                  {data.type || "—"}{data.container ? ` · ${data.container}` : ""}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Date de prélèvement</p>
                <p className="font-medium text-[#1E2A47]">{fmtDate(data.collection_date)}</p>
              </div>
              <div>
                <p className="text-slate-500">Commande</p>
                <p className="font-medium text-[#1E2A47]">
                  {data.order?.matricule ? (
                    <>
                      {data.order.matricule}{" "}
                      <StatusBadge status={data.order.status} className="ml-1 align-middle" />
                    </>
                  ) : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1E2A47]">Résultats</p>
              {data.results && data.results.length > 0 ? (
                <ul className="divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB]">
                  {data.results.map((r, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1E2A47]">{r.test_name || "—"}</p>
                        <p className="text-slate-600">
                          {r.value ?? "—"}{r.unit ? ` ${r.unit}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Aucun résultat disponible.</p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => void reset()}
              className="h-11 w-full !bg-[#1E2A47] !text-white hover:!bg-[#162544]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nouveau scan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
