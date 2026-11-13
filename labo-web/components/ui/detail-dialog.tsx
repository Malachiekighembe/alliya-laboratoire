"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "../../lib/utils";

export interface DetailField {
  label: string;
  value?: React.ReactNode;
  /** Rend la valeur en police monospace (matricules, identifiants). */
  mono?: boolean;
  /** Étend la valeur sur deux colonnes. */
  wide?: boolean;
}

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields?: DetailField[];
  children?: React.ReactNode;
}

function isEmpty(value: React.ReactNode): boolean {
  return value === null || value === undefined || value === "" || value === "—";
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  fields,
  children,
}: DetailDialogProps) {
  const rows = (fields ?? []).filter((f) => f.value !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
            {badge}
          </div>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {rows.length > 0 && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {rows.map((field) => (
              <div
                key={field.label}
                className={cn("min-w-0", field.wide && "sm:col-span-2")}
              >
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {field.label}
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-sm text-slate-800 break-words",
                    field.mono && "font-mono text-[13px]",
                    isEmpty(field.value) && "text-slate-400"
                  )}
                >
                  {isEmpty(field.value) ? "—" : field.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {children}
      </DialogContent>
    </Dialog>
  );
}