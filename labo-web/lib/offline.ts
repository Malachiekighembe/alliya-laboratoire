export interface OutboxItem {
  id: string;
  method: string;
  path: string;
  body: unknown;
  createdAt: number;
}

const STORAGE_KEY = "alliya.outbox.v1";

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeOnline(cb: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const on = () => cb(true);
  const off = () => cb(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}

function read(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: OutboxItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // stockage indisponible: ignorer silencieusement
  }
}

type FlushListener = () => void | Promise<void>;
let flushListener: FlushListener | null = null;

export function onFlush(cb: FlushListener): void {
  flushListener = cb;
}

export async function triggerFlush(): Promise<void> {
  if (flushListener) await flushListener();
}

export function enqueue(method: string, path: string, body: unknown): OutboxItem {
  const item: OutboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    method: method.toUpperCase(),
    path,
    body,
    createdAt: Date.now(),
  };
  const items = read();
  items.push(item);
  write(items);
  return item;
}

export function list(): OutboxItem[] {
  return read();
}

export function remove(id: string): void {
  write(read().filter((it) => it.id !== id));
}

export function clear(): void {
  write([]);
}

export function size(): number {
  return read().length;
}
