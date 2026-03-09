/**
 * Client-side saved grants store backed by localStorage.
 * Replaces all network calls to /api/v1/saved-grants/* so no backend is needed.
 */

const STORAGE_KEY = 'nexar_saved_grants';

export interface SavedGrant {
  id: number;
  grant_id: string;
  grant_title: string;
  grant_agency?: string;
  grant_description?: string;
  grant_eligibility?: string;
  grant_category?: string;
  grant_award_amount?: string;
  grant_close_date?: string;
  grant_url?: string;
  grant_cfda_number?: string;
  saved_at: string;
  is_favorite: boolean;
  status: 'saved' | 'applied' | 'awarded';
}

function load(): SavedGrant[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(grants: SavedGrant[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
}

export const savedGrantsStore = {
  list(params?: { favorites_only?: boolean }): SavedGrant[] {
    let grants = load();
    if (params?.favorites_only) grants = grants.filter((g) => g.is_favorite);
    return grants;
  },

  isSaved(grantId: string): boolean {
    return load().some((g) => g.grant_id === grantId);
  },

  get(grantId: string): SavedGrant | undefined {
    return load().find((g) => g.grant_id === grantId);
  },

  getById(id: number): SavedGrant | undefined {
    return load().find((g) => g.id === id);
  },

  add(data: {
    grant_id: string;
    grant_title: string;
    grant_agency?: string;
    grant_description?: string;
    grant_eligibility?: string;
    grant_category?: string;
    grant_award_amount?: string;
    grant_close_date?: string;
    grant_url?: string;
    grant_cfda_number?: string;
  }): SavedGrant {
    const grants = load();
    const existing = grants.find((g) => g.grant_id === data.grant_id);
    if (existing) return existing;
    const newGrant: SavedGrant = {
      id: Date.now(),
      ...data,
      saved_at: new Date().toISOString(),
      is_favorite: false,
      status: 'saved',
    };
    grants.push(newGrant);
    save(grants);
    return newGrant;
  },

  remove(id: string | number): void {
    const grants = load();
    const numId = Number(id);
    // id can be either the numeric id or a grant_id string
    const filtered = grants.filter((g) => g.id !== numId && g.grant_id !== String(id));
    save(filtered);
  },

  removeByGrantId(grantId: string): void {
    save(load().filter((g) => g.grant_id !== grantId));
  },

  toggleFavorite(id: string | number): SavedGrant | undefined {
    const grants = load();
    const numId = Number(id);
    const grant = grants.find((g) => g.id === numId);
    if (!grant) return undefined;
    grant.is_favorite = !grant.is_favorite;
    save(grants);
    return grant;
  },

  stats() {
    const grants = load();
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = { saved: 0, applied: 0, awarded: 0 };
    let favorites = 0;
    for (const g of grants) {
      if (g.grant_category) byCategory[g.grant_category] = (byCategory[g.grant_category] || 0) + 1;
      if (g.status) byStatus[g.status] = (byStatus[g.status] || 0) + 1;
      if (g.is_favorite) favorites++;
    }
    return { total_saved: grants.length, favorites, by_category: byCategory, by_status: byStatus };
  },
};
