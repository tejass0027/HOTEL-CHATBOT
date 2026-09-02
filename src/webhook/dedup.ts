// In-memory dedup for Meta's webhook redeliveries, keyed by message id.
// TODO(phase 2): back this with the DB (Message table) so dedup survives
// restarts and works across multiple instances.

const seenMessageIds = new Map<string, number>();
const TTL_MS = 10 * 60 * 1000; // Meta redelivers within minutes, not hours

export function isDuplicateMessage(messageId: string): boolean {
  cleanupExpired();
  if (seenMessageIds.has(messageId)) {
    return true;
  }
  seenMessageIds.set(messageId, Date.now());
  return false;
}

function cleanupExpired(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, seenAt] of seenMessageIds) {
    if (seenAt < cutoff) {
      seenMessageIds.delete(id);
    }
  }
}
