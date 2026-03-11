/**
 * Server-side grant cache backed by Upstash Redis.
 * Grants are stored as JSON strings under the key "grant:{id}" with a 24-hour TTL.
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
    await kv.set(`grant:${grant.id}`, JSON.stringify(grant), { ex: TTL_SECONDS });
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
    const raw = await kv.get<string>(`grant:${id}`);
    if (!raw) return null;
    // @upstash/redis auto-parses JSON; accept both parsed object and raw string
    if (typeof raw === 'object') return raw as unknown as Grant;
    return JSON.parse(raw) as Grant;
  } catch {
    return null;
  }
}
