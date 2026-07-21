/**
 * In-memory rate limiter for API route protection.
 *
 * Uses a sliding window approach per key (userId or IP).
 * Each Vercel serverless instance has its own Map — this provides
 * solid protection against casual abuse. Distributed rate limiting
 * (Redis/Upstash) would be needed for botnet-level attacks but is
 * out of scope for the current MVP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms) when the window resets
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check and consume a rate limit token.
 *
 * @param key       Unique identifier (e.g. `"ai-lifesaver:userId"` or `"anon-auth:ip"`)
 * @param limit     Maximum number of requests allowed within the window
 * @param windowMs  Duration of the rate-limit window in milliseconds
 * @returns `{ success, remaining }` — success=false means the request should be rejected (429)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired → reset
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Within window
  if (entry.count < limit) {
    entry.count++;
    return { success: true, remaining: limit - entry.count };
  }

  // Over limit
  return { success: false, remaining: 0 };
}

/**
 * Helper to extract the client IP from request headers (Vercel/Cloudflare).
 * Falls back to "unknown" if no header is present.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
