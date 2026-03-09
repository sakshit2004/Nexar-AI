/**
 * Server-side in-memory grant cache shared between Next.js API routes.
 * Stores grants discovered by /api/v1/grants/recommended and /api/v1/grants/search
 * so that /api/v1/grants/[id] can look them up.
 *
 * This module is only imported by server-side API routes (never client-side).
 * The cache lives for the lifetime of the serverless function instance.
 */

const cache = new Map<string, any>();
const MAX_CACHE_SIZE = 500;

export function storeGrants(grants: any[]): void {
  for (const g of grants) {
    if (g?.id) {
      cache.set(String(g.id), g);
      if (cache.size > MAX_CACHE_SIZE) {
        // Evict oldest entry
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
    }
  }
}

export function getGrant(id: string): any | undefined {
  return cache.get(id);
}

export function getCacheSize(): number {
  return cache.size;
}
