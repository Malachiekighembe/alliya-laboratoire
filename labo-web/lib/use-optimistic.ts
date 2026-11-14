/** Identifiant local temporaire (avant confirmation serveur). */
export function optimisticId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}