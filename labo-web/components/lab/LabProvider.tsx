"use client";

import * as React from "react";
import { Laboratory } from "@/lib/api-client";
import { getActiveLabId, setActiveLabId } from "@/lib/lab";

interface LabContextType {
  user: { laboratory_id: string | null; roles: string[] } | null;
  activeLabId: string | null;
  activeLab: Laboratory | null;
  laboratories: Laboratory[];
  setActiveLab: (id: string | null) => void;
  isSuperAdmin: boolean;
  canSwitchLab: boolean;
  loading: boolean;
}

const LabContext = React.createContext<LabContextType | null>(null);

export function useLab() {
  const ctx = React.useContext(LabContext);
  if (!ctx) throw new Error("useLab must be used within a LabProvider");
  return ctx;
}

interface LabProviderProps {
  children: React.ReactNode;
  user: { laboratory_id: string | null; roles: string[] } | null;
  laboratories: Laboratory[];
}

export function LabProvider({ children, user, laboratories }: LabProviderProps) {
  const isSuperAdmin = !!user && user.roles.includes("super_admin");
  const userLabId = user?.laboratory_id ?? null;
  const canSwitchLab = isSuperAdmin;

  const [activeLabId, setActiveLabIdState] = React.useState<string | null>(null);
  const [activeLab, setActiveLab] = React.useState<Laboratory | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let stored = getActiveLabId();
    const availableIds = laboratories.map((l) => l.id);

    if (!stored || (isSuperAdmin && !availableIds.includes(stored))) {
      stored = userLabId || (laboratories[0]?.id ?? null);
    }

    setActiveLabIdState(stored);
    setActiveLab(laboratories.find((l) => l.id === stored) ?? null);
    setLoading(false);
  }, [laboratories, userLabId, isSuperAdmin]);

  const handleSetActiveLab = React.useCallback(
    (id: string | null) => {
      setActiveLabIdState(id);
      setActiveLabId(id);
      setActiveLab(laboratories.find((l) => l.id === id) ?? null);
    },
    [laboratories]
  );

  const value: LabContextType = {
    user,
    activeLabId,
    activeLab,
    laboratories,
    setActiveLab: handleSetActiveLab,
    isSuperAdmin,
    canSwitchLab,
    loading,
  };

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export { LabContext };
