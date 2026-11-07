export const ACTIVE_LAB_KEY = "alliaya_active_laboratory_id";

export function getActiveLabId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_LAB_KEY);
  } catch {
    return null;
  }
}

export function setActiveLabId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ACTIVE_LAB_KEY, id);
    else localStorage.removeItem(ACTIVE_LAB_KEY);
  } catch {}
}
