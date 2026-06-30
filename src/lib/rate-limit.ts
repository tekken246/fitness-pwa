import 'server-only';

import { AppError } from '@/lib/errors';

/**
 * Per-user rate limiting for mutating server actions.
 *
 * Uses Upstash Redis (the standard serverless limiter; Vercel KV is Upstash under the
 * hood) via a sliding window. If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are
 * not set, every call is a no-op so the app builds and runs with zero config and starts
 * enforcing the moment the env vars are present.
 */

export type RateBucket = 'routine-write' | 'workout-start' | 'session-write';

const BUCKET_CONFIG: Record<RateBucket, { tokens: number; window: `${number} s` }> = {
  // Destructive / creation endpoints — tight.
  'routine-write': { tokens: 20, window: '60 s' },
  // Starting/resuming a session — moderate.
  'workout-start': { tokens: 30, window: '60 s' },
  // High-frequency autosave (set/notes/draft sync) — generous so normal logging is never blocked.
  'session-write': { tokens: 120, window: '60 s' },
};

type LimitFn = (key: string) => Promise<boolean>;

let limitersPromise: Promise<Map<RateBucket, LimitFn> | null> | null = null;

async function buildLimiters(): Promise<Map<RateBucket, LimitFn> | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null; // Not configured -> no-op (local/CI/first deploy).
  }

  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import('@upstash/ratelimit'),
    import('@upstash/redis'),
  ]);

  const redis = new Redis({ url, token });
  const map = new Map<RateBucket, LimitFn>();

  for (const [bucket, cfg] of Object.entries(BUCKET_CONFIG) as [RateBucket, { tokens: number; window: `${number} s` }][]) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
      prefix: `fittrack:rl:${bucket}`,
      analytics: false,
    });
    map.set(bucket, async (key: string) => (await limiter.limit(key)).success);
  }

  return map;
}

/** Throws AppError('rate_limited') when the per-user window is exceeded. No-ops when unconfigured. */
export async function enforceRateLimit(clerkUserId: string, bucket: RateBucket): Promise<void> {
  if (!limitersPromise) {
    limitersPromise = buildLimiters();
  }

  const limiters = await limitersPromise;
  if (!limiters) {
    return;
  }

  const limit = limiters.get(bucket);
  if (!limit) {
    return;
  }

  const ok = await limit(clerkUserId);
  if (!ok) {
    throw new AppError('rate_limited', 'Too many requests. Please slow down and try again in a moment.');
  }
}
