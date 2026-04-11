/**
 * Rate limiter — sliding-window, per-IP.
 *
 * Two backends:
 *   1. Redis  — enabled when REDIS_URL is set; works across multiple replicas.
 *   2. Memory — fallback for single-process / single-replica deployments.
 *
 * Usage (Node.js API routes only — NOT edge middleware):
 *
 *   import { checkRateLimit } from "@/lib/rate-limit";
 *
 *   const result = await checkRateLimit("invoice", ip, { window: 60_000, max: 20 });
 *   if (result.limited) {
 *     return NextResponse.json({ error: "Too many requests" }, {
 *       status: 429,
 *       headers: { "Retry-After": String(result.retryAfter) },
 *     });
 *   }
 *
 * NOTE: The Next.js middleware (src/middleware.ts) runs on the Edge Runtime and
 * uses a separate in-process map for a lightweight first-pass check.  This
 * module is the authoritative limiter for multi-replica deployments and should
 * be called inside API route handlers.
 */

export interface LimitConfig {
  /** Sliding window size in milliseconds. */
  window: number;
  /** Maximum requests allowed within the window. */
  max: number;
}

export interface LimitResult {
  limited:    boolean;
  /** Seconds until the window resets (only meaningful when limited === true). */
  retryAfter: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory backend (single-process fallback)
// ─────────────────────────────────────────────────────────────────────────────

interface WindowEntry {
  count:       number;
  windowStart: number;
  window:      number; // ms — stored so the pruner can expire relative to each entry's own window
}

const memoryStore = new Map<string, WindowEntry>();

// Prune stale entries every 5 minutes.
// Each entry stores the window size so pruning is relative to that entry's
// actual window, not a hardcoded global cap.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (now - v.windowStart > v.window * 2) {
      memoryStore.delete(k);
    }
  }
}, 5 * 60_000);

function checkMemory(storeKey: string, cfg: LimitConfig): LimitResult {
  const now   = Date.now();
  const entry = memoryStore.get(storeKey);

  if (!entry || now - entry.windowStart >= cfg.window) {
    memoryStore.set(storeKey, { count: 1, windowStart: now, window: cfg.window });
    return { limited: false, retryAfter: 0 };
  }

  if (entry.count >= cfg.max) {
    const retryAfter = Math.ceil((cfg.window - (now - entry.windowStart)) / 1000);
    return { limited: true, retryAfter };
  }

  entry.count += 1;
  return { limited: false, retryAfter: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Redis backend (multi-replica)
// ─────────────────────────────────────────────────────────────────────────────

let redis: import("ioredis").Redis | null = null;
let redisInitialized = false;

function getRedis(): import("ioredis").Redis | null {
  if (redisInitialized) return redis;
  redisInitialized = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    // Dynamic require keeps edge-runtime bundles from importing ioredis.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require("ioredis") as typeof import("ioredis");
    redis = new IORedis.default(url, {
      maxRetriesPerRequest: 2,
      connectTimeout:       3000,
      lazyConnect:          true,
    });

    redis.on("error", (err: Error) => {
      console.warn("[rate-limit] Redis error — falling back to in-memory:", err.message);
      redis = null;
      redisInitialized = false; // allow re-init on next request
    });
  } catch (err) {
    console.warn("[rate-limit] ioredis unavailable — using in-memory fallback:", err);
  }

  return redis;
}

/**
 * Atomic sliding-window check via a Lua script.
 * Returns the current count after incrementing (> cfg.max → limited).
 *
 * Script uses a simple fixed-window keyed by floor(now / window) so that
 * two processes sharing the same Redis instance always operate on the same
 * bucket — the standard multi-replica approach.
 */
const LUA_SCRIPT = `
local key    = KEYS[1]
local window = tonumber(ARGV[1])
local max    = tonumber(ARGV[2])
local now    = tonumber(ARGV[3])

local bucket  = math.floor(now / window)
local field   = tostring(bucket)
local current = tonumber(redis.call('HGET', key, field) or 0)

if current >= max then
  local ttl = window - (now % window)
  return {1, math.ceil(ttl / 1000)}   -- {limited=1, retryAfterSecs}
end

redis.call('HSET', key, field, current + 1)
redis.call('PEXPIRE', key, window * 2)
return {0, 0}
`;

async function checkRedis(
  r:        import("ioredis").Redis,
  storeKey: string,
  cfg:      LimitConfig
): Promise<LimitResult> {
  try {
    const now    = Date.now();
    const result = await (r as import("ioredis").Redis & {
      eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<[number, number]>;
    }).eval(LUA_SCRIPT, 1, storeKey, cfg.window, cfg.max, now) as [number, number];

    return {
      limited:    result[0] === 1,
      retryAfter: result[1] ?? 0,
    };
  } catch (err) {
    // Redis unavailable — degrade gracefully to memory.
    console.warn("[rate-limit] Redis eval failed, using memory fallback:", (err as Error).message);
    return checkMemory(storeKey, cfg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check the rate limit for a given (key, ip) pair.
 *
 * @param key    - Logical rate-limit bucket name (e.g. "invoice", "fbr").
 * @param ip     - Client IP address.
 * @param cfg    - Window and max-requests configuration.
 */
export async function checkRateLimit(
  key: string,
  ip:  string,
  cfg: LimitConfig
): Promise<LimitResult> {
  const storeKey = `rl:${key}:${ip}`;
  const r        = getRedis();

  if (r) {
    return checkRedis(r, storeKey, cfg);
  }

  return checkMemory(storeKey, cfg);
}
