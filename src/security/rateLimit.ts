// In-memory sliding-window rate limit per phone number. Resets on restart
// and doesn't share state across instances — fine at this scale (a single
// restaurant's guest volume), where the goal is just capping abuse/spam
// cost, not perfect accuracy. Move to Redis if this ever runs multi-instance.

const WINDOW_MS = 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 20;

const recentMessageTimes = new Map<string, number[]>();

/** Records this message and returns whether the sender is over the limit. */
export function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const recent = (recentMessageTimes.get(phone) ?? []).filter((t) => t > cutoff);

  if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
    recentMessageTimes.set(phone, recent);
    return true;
  }

  recent.push(now);
  recentMessageTimes.set(phone, recent);
  return false;
}
