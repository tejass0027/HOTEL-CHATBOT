// Minimal logger for phase 1. Phase 6 will replace this with structured
// logging (pino/winston) + persistence, but redaction starts now since it's
// easy to forget to retrofit later.

export function redactPhone(phone: string): string {
  if (phone.length <= 4) return "***";
  return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export function log(message: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${message}`, meta ?? "");
}
