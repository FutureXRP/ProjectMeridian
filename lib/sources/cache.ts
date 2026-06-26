/**
 * Server-side cache + rate limiting.
 *
 * NEVER import this from a client component — it wraps calls to source APIs and
 * must run server-side only (whitepaper §5: "never hammer source APIs from the
 * client"). In-memory cache is per-process; on serverless it is per-instance,
 * so back it with Supabase/KV later for a shared cache. The pure TTL +
 * single-flight + token-bucket logic here is what matters for correctness.
 */

interface Entry<T> {
  value: T;
  expires: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export interface CacheOptions {
  /** Injectable clock (ms). Defaults to Date.now; tests pass a controllable one. */
  now?: () => number;
}

/**
 * Memoize an async fetcher under `key` for `ttlMs`, with single-flight de-dup so
 * concurrent callers share one in-flight request. Failures are never cached.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  opts: CacheOptions = {},
): Promise<T> {
  const now = opts.now ?? Date.now;

  const hit = store.get(key);
  if (hit && hit.expires > now()) return hit.value as T;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      const value = await fetcher();
      store.set(key, { value, expires: now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Clear all cached + in-flight entries (used by tests). */
export function clearCache(): void {
  store.clear();
  inflight.clear();
}

/**
 * Token-bucket rate limiter. `tryTake()` is non-blocking and clock-driven (so it
 * is deterministically testable); `take()` awaits a free token.
 */
export class RateLimiter {
  private tokens: number;
  private last: number;

  constructor(
    private readonly ratePerSec: number,
    private readonly capacity: number,
    private readonly now: () => number = Date.now,
  ) {
    this.tokens = capacity;
    this.last = now();
  }

  private refill(): void {
    const t = this.now();
    const elapsedSec = (t - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.ratePerSec);
    this.last = t;
  }

  tryTake(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  async take(): Promise<void> {
    while (!this.tryTake()) {
      await new Promise((r) => setTimeout(r, Math.ceil(1000 / this.ratePerSec)));
    }
  }
}
