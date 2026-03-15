/**
 * Redis client via @upstash/redis.
 *
 * Supports both naming conventions:
 *   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (manual setup)
 *   - KV_REST_API_URL / KV_REST_API_TOKEN (Vercel + Upstash integration)
 */

import { Redis } from '@upstash/redis';

function createRedis() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or use Vercel + Upstash integration (KV_REST_API_URL, KV_REST_API_TOKEN).',
    );
  }

  return new Redis({ url, token });
}

// Lazily instantiated so missing env vars only throw when kv is actually used,
// not at module import time (which would break local dev without KV).
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = createRedis();
  }
  return _redis;
}

// Named export matching the original @vercel/kv usage pattern.
export const kv = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedis()[prop as keyof Redis];
  },
});
