"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { isOnline, subscribeOnline } from "@/lib/offline";

export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(true);
  const [pending, setPending] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [synced, setSynced] = useState<boolean>(false);

  useEffect(() => {
    setOnline(isOnline());
    setPending(api.outboxSize());
    const unsub = subscribeOnline(async (nowOnline) => {
      setOnline(nowOnline);
      if (nowOnline && api.outboxSize() > 0) {
        setSyncing(true);
        setSynced(false);
        try {
          await api.flushOutbox();
        } finally {
          setSyncing(false);
          const left = api.outboxSize();
          setPending(left);
          if (left === 0) {
            setSynced(true);
            setTimeout(() => setSynced(false), 2500);
          }
        }
      } else {
        setPending(api.outboxSize());
      }
    });
    const t = window.setInterval(() => setPending(api.outboxSize()), 1500);
    return () => {
      unsub();
      window.clearInterval(t);
    };
  }, []);

  if (online && !syncing && !synced) return null;

  let message = "";
  if (!online) {
    message = pending > 0
      ? `Hors ligne — ${pending} action(s) seront enregistrées et synchronisées`
      : "Hors ligne — les actions seront enregistrées et synchronisées";
  } else if (syncing) {
    message = "Synchronisation…";
  } else if (synced) {
    message = "Synchronisé";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="print:hidden w-full bg-[#1E2A47] text-white text-sm px-4 py-2 text-center border-b border-[#3D9597]"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#3D9597]" aria-hidden="true" />
        {message}
      </span>
    </div>
  );
}

export default OfflineBanner;
