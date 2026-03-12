/**
 * Saved grants store — Zustand with optimistic UI, backed by /api/v1/saved.
 * localStorage is no longer used; grants are persisted in Redis via the API.
 */

import { create } from 'zustand';
import type { Grant } from './grant-cache';

export interface SavedGrant extends Grant {
  saved_at?: string;
  is_favorite?: boolean;
  status?: 'saved' | 'applied' | 'awarded';
}

interface SavedGrantsState {
  savedGrants: SavedGrant[];
  /** True after the first successful fetch */
  hydrated: boolean;
  /** Fetch saved grants from the server and hydrate the store */
  fetchSaved: () => Promise<void>;
  /** Returns true if a grant with this ID is saved */
  isSaved: (grantId: string) => boolean;
  /** Optimistic add + POST /api/v1/saved */
  addGrant: (grant: Grant) => Promise<void>;
  /** Optimistic remove + DELETE /api/v1/saved */
  removeGrant: (grantId: string) => Promise<void>;
  /** Stats derived from in-memory list */
  stats: () => {
    total_saved: number;
    favorites: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
  };
}

export const useSavedGrantsStore = create<SavedGrantsState>()((set, get) => ({
  savedGrants: [],
  hydrated: false,

  fetchSaved: async () => {
    try {
      const res = await fetch('/api/v1/saved');
      if (!res.ok) return;
      const data = await res.json();
      set({ savedGrants: data.saved_grants ?? [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  isSaved: (grantId) => get().savedGrants.some((g) => g.id === grantId),

  addGrant: async (grant) => {
    // Optimistic update
    const already = get().savedGrants.some((g) => g.id === grant.id);
    if (!already) {
      set((s) => ({ savedGrants: [...s.savedGrants, { ...grant, saved_at: new Date().toISOString(), is_favorite: false, status: 'saved' }] }));
    }
    try {
      await fetch('/api/v1/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId: grant.id }),
      });
    } catch {
      // Rollback on failure
      set((s) => ({ savedGrants: s.savedGrants.filter((g) => g.id !== grant.id) }));
    }
  },

  removeGrant: async (grantId) => {
    const prev = get().savedGrants;
    // Optimistic remove
    set((s) => ({ savedGrants: s.savedGrants.filter((g) => g.id !== grantId) }));
    try {
      await fetch('/api/v1/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
    } catch {
      // Rollback on failure
      set({ savedGrants: prev });
    }
  },

  stats: () => {
    const grants = get().savedGrants;
    const by_category: Record<string, number> = {};
    const by_status: Record<string, number> = { saved: 0, applied: 0, awarded: 0 };
    let favorites = 0;
    for (const g of grants) {
      if (g.category) by_category[g.category] = (by_category[g.category] ?? 0) + 1;
      const s = g.status ?? 'saved';
      by_status[s] = (by_status[s] ?? 0) + 1;
      if (g.is_favorite) favorites++;
    }
    return { total_saved: grants.length, favorites, by_category, by_status };
  },
}));

// ---------------------------------------------------------------------------
// Legacy object-style shim — keeps existing callers in lib/api.ts working
// while we transition pages to use useSavedGrantsStore directly.
// ---------------------------------------------------------------------------
export const savedGrantsStore = {
  list: (params?: { favorites_only?: boolean }) => {
    const g = useSavedGrantsStore.getState().savedGrants;
    return params?.favorites_only ? g.filter((x) => x.is_favorite) : g;
  },
  isSaved: (grantId: string) => useSavedGrantsStore.getState().isSaved(grantId),
  get: (grantId: string) => useSavedGrantsStore.getState().savedGrants.find((g) => g.id === grantId),
  add: async (data: { grant_id: string; grant_title: string; [key: string]: unknown }) => {
    const grant: Grant = {
      id: data.grant_id,
      title: (data.grant_title as string) ?? '',
      agency: (data.grant_agency as string) ?? '',
      description: (data.grant_description as string) ?? '',
      eligibility: (data.grant_eligibility as string) ?? '',
      award_amount: (data.grant_award_amount as string) ?? 'Varies',
      deadline: (data.grant_close_date as string) ?? '',
      category: (data.grant_category as string) ?? 'Technology',
      url: (data.grant_url as string) ?? '',
      opportunity_number: (data.grant_cfda_number as string) ?? '',
    };
    await useSavedGrantsStore.getState().addGrant(grant);
    return { ...grant, saved_at: new Date().toISOString(), is_favorite: false, status: 'saved' as const };
  },
  remove: async (id: string | number) => {
    const grants = useSavedGrantsStore.getState().savedGrants;
    const target = typeof id === 'number'
      ? grants.find((_, i) => i === id)
      : grants.find((g) => g.id === String(id));
    if (target) await useSavedGrantsStore.getState().removeGrant(target.id);
  },
  removeByGrantId: async (grantId: string) => {
    await useSavedGrantsStore.getState().removeGrant(grantId);
  },
  stats: () => useSavedGrantsStore.getState().stats(),
};
