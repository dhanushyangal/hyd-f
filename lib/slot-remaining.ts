/** Daily window stored as a UTC start hour. Labels stay local; the clock is UTC. */

export function slotRemaining(
  startHour: number,
  durationHours: number,
  now = new Date()
): { open: boolean; remainingMs: number } {
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const length = durationHours * 60 * 60 * 1000;
  const t = now.getTime();
  for (const offset of [0, -1]) {
    const start = day + offset * 24 * 60 * 60 * 1000 + startHour * 60 * 60 * 1000;
    const end = start + length;
    if (t >= start && t < end) return { open: true, remainingMs: end - t };
  }
  let next = day + startHour * 60 * 60 * 1000;
  if (next <= t) next += 24 * 60 * 60 * 1000;
  return { open: false, remainingMs: next - t };
}

export function formatSlotRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}
