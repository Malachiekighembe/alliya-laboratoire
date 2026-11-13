"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  error?: string | null;
  saving?: boolean;
  submitLabel?: string;
  size?: "md" | "lg";
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  error,
  saving,
  submitLabel = "Enregistrer",
  size = "md",
  onSubmit,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className={cn(size === "lg" && "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          {description ? <DialogDescription className="text-xs sm:text-sm text-slate-500">{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="space-y-3 sm:space-y-4">{children}</div>
          <div className="sticky bottom-0 -mx-5 mt-1 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 pb-1 pt-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2 sm:backdrop-blur-none">
            <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" className="h-10 sm:h-9 border-0 !bg-[#1E2A47] !text-white shadow-sm hover:!bg-[#162544]" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Enregistrement…" : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs sm:text-sm text-slate-700">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-slate-400">{hint}</p> : null}
    </div>
  );
}

export const controlClass =
  "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#3D9597] focus:outline-none focus:ring-2 focus:ring-[#3D9597]/15 disabled:bg-slate-50 disabled:text-slate-500";