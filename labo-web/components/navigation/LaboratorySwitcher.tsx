"use client";

import * as React from "react";
import { useLab } from "@/components/lab/LabProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Building2, ShieldCheck } from "lucide-react";

export function LaboratorySwitcher() {
  const { user } = useAuth();
  const {
    activeLab,
    activeLabId,
    laboratories,
    setActiveLab,
    isSuperAdmin,
    canSwitchLab,
    loading,
  } = useLab();

  if (loading) return null;

  const labs = isSuperAdmin ? laboratories : laboratories.filter((l) => l.id === user?.laboratory_id);

  if (labs.length === 0) return null;

  const current = labs.find((l) => l.id === activeLabId) ?? labs[0];

  const handleChange = (value: string) => {
    setActiveLab(value);
  };

  return (
    <div className="flex items-center gap-3">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeLabId ?? ""}
        onValueChange={handleChange}
        disabled={!canSwitchLab}
      >
        <SelectTrigger className="w-[220px] text-xs bg-background">
          <SelectValue placeholder={current?.name || "Laboratoire"} />
        </SelectTrigger>
        <SelectContent>
          {labs.map((lab) => (
            <SelectItem key={lab.id} value={lab.id}>
              {lab.name}{lab.id === activeLabId ? " (actif)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!canSwitchLab && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Laboratoire assigné
        </span>
      )}
    </div>
  );
}
