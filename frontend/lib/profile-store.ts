/**
 * Organization profile store.
 * Source of truth is now /api/v1/profile (Upstash Redis).
 * The Zustand store caches the value in memory for the current session only.
 */

import { create } from 'zustand';

export interface OrganizationProfile {
  full_name: string;
  organization_name: string;
  organization_type: string;
  focus_areas: string[];
  location_state: string;
  location_county: string;
  grant_amount_min: number | null;
  grant_amount_max: number | null;
  keywords: string[];
  onboarding_completed: boolean;
}

interface ProfileState {
  profile: OrganizationProfile | null;
  /** True only after a successful GET /api/v1/profile (server state is confirmed) */
  hydrated: boolean;
  /** True after the first fetch attempt, regardless of success or failure */
  fetchAttempted: boolean;
  /** Fetch profile from server and hydrate store */
  fetchProfile: () => Promise<void>;
  /** Save profile fields to server and update local state */
  updateProfile: (data: Partial<OrganizationProfile>) => Promise<void>;
  clearProfile: () => void;
  hasProfile: () => boolean;
}

const defaultProfile: OrganizationProfile = {
  full_name: '',
  organization_name: '',
  organization_type: '',
  focus_areas: [],
  location_state: '',
  location_county: '',
  grant_amount_min: null,
  grant_amount_max: null,
  keywords: [],
  onboarding_completed: false,
};

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  hydrated: false,
  fetchAttempted: false,

  fetchProfile: async () => {
    try {
      const res = await fetch('/api/v1/profile');
      if (!res.ok) { set({ fetchAttempted: true }); return; }
      const data = await res.json();
      set({ profile: data.profile ?? null, hydrated: true, fetchAttempted: true });
    } catch {
      set({ fetchAttempted: true });
    }
  },

  updateProfile: async (data) => {
    // Merge locally first (optimistic)
    const current = get().profile ?? defaultProfile;
    const merged: OrganizationProfile = {
      ...current,
      ...data,
      focus_areas: data.focus_areas ?? current.focus_areas ?? [],
      keywords: data.keywords ?? current.keywords ?? [],
    };
    set({ profile: merged });

    // Persist to server
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated.profile) set({ profile: updated.profile });
      }
    } catch {
      // Keep the optimistic state — will sync on next mount
    }
  },

  clearProfile: () => set({ profile: null }),

  hasProfile: () => {
    const p = get().profile;
    if (!p) return false;
    return !!(p.organization_name || p.focus_areas?.length > 0);
  },
}));
