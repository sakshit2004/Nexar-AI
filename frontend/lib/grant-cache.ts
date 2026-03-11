/**
 * Server-side grant cache backed by Upstash Redis.
 * Grants are stored as plain objects under the key "grant:{id}" with a 24-hour TTL.
 * @upstash/redis automatically serialises objects to JSON on write and deserialises on read.
 * All functions are async — callers must await them.
 */

import { kv } from '@/lib/kv';

export interface Grant {
  id: string;
  title: string;
  agency: string;
  description: string;
  eligibility: string;
  award_amount: string;
  deadline: string;
  category: string;
  url: string;
  opportunity_number: string;
}

const TTL_SECONDS = 86400; // 24 hours

export async function storeGrant(grant: Grant): Promise<void> {
  if (!grant?.id) return;
  try {
    await kv.set(`grant:${grant.id}`, grant, { ex: TTL_SECONDS });
  } catch {
    // Redis not configured — silently skip caching in local dev
  }
}

export async function storeGrants(grants: Grant[]): Promise<void> {
  if (!grants.length) return;
  await Promise.all(grants.map(storeGrant));
}

export async function getGrant(id: string): Promise<Grant | null> {
  try {
    const grant = await kv.get<Grant>(`grant:${id}`);
    return grant ?? null;
  } catch {
    return null;
  }
}
