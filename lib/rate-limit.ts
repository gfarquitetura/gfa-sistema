// Simple in-memory sliding-window rate limiter.
// Suitable for a single-server deployment (small firm).
// Keyed by any string (user ID, IP, etc.).

const windows = new Map<string, number[]>()

/**
 * Returns true if the key is within the allowed limit.
 * Cleans up timestamps older than the window on each call.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now  = Date.now()
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs)

  if (hits.length >= limit) return false

  hits.push(now)
  windows.set(key, hits)
  return true
}
