const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

const fetchWithError = async (urlOrPath: string, options?: RequestInit) => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${base}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;

  try {
    if (DEBUG) console.log('API Call:', url);

    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const detail =
        typeof error?.detail === 'string'
          ? error.detail
          : Array.isArray(error?.detail)
          ? error.detail.map((x: unknown) => (x as Record<string, string>)?.msg ?? x).join(', ')
          : `API Error: ${response.status}`;
      throw new Error(detail);
    }

    return await response.json();
  } catch (error) {
    if (DEBUG) console.error('API Error:', error);
    throw error;
  }
};

// Grants API
export const grantsApi = {
  search: async (params: {
    q?: string;
    category?: string;
    grant_type?: 'federal' | 'state' | 'foundation' | 'corporate' | 'all';
    min_amount?: number;
    max_amount?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString());
    });
    return fetchWithError(`/api/v1/grants/search?${searchParams}`);
  },

  getById: async (id: string) => {
    return fetchWithError(`/api/v1/grants/${id}`);
  },

  getRecommendations: async (
    _token: string,
    params?: { q?: string; grant_type?: 'federal' | 'state' | 'foundation' | 'corporate' | 'all'; min_amount?: number; max_amount?: number; seed?: number },
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.grant_type) searchParams.append('grant_type', params.grant_type);
    if (params?.min_amount != null) searchParams.append('min_amount', String(params.min_amount));
    if (params?.max_amount != null) searchParams.append('max_amount', String(params.max_amount));
    if (params?.seed != null) searchParams.append('seed', String(params.seed));
    const qs = searchParams.toString();
    return fetchWithError(`/api/v1/grants/recommended${qs ? `?${qs}` : ''}`);
  },
};

// Matching / Analysis API
export const matchingApi = {
  getMatch: async (grantId: string) => {
    return fetchWithError(`/api/v1/grants/${grantId}/match`);
  },

  analyze: async (grantId: string, _token?: string, grantData?: unknown) => {
    const body = grantData ? JSON.stringify({ grant: grantData }) : undefined;
    return fetchWithError(`/api/v1/grants/${grantId}/analyze`, {
      method: 'POST',
      body,
    });
  },
};

// Saved Grants API — backed by /api/v1/saved (Upstash Redis via server route)
export const savedGrantsApi = {
  save: async (_token: string, grantData: Record<string, string>) => {
    const grantId = grantData?.id || grantData?.grant_id || '';
    if (!grantId) throw new Error('grantId is required');
    return fetchWithError('/api/v1/saved', {
      method: 'POST',
      body: JSON.stringify({ grantId }),
    });
  },

  list: async (_token?: string, params?: { favorites_only?: boolean }) => {
    const res = await fetchWithError('/api/v1/saved');
    const grants = res?.saved_grants ?? [];
    const filtered = params?.favorites_only ? grants.filter((g: { is_favorite: boolean }) => g.is_favorite) : grants;
    const all: { is_favorite: boolean; category?: string; status?: string }[] = res?.saved_grants ?? [];
    const favoritesCount = all.filter((g) => g.is_favorite).length;
    const by_category: Record<string, number> = {};
    for (const g of all) {
      if (g.category) by_category[g.category] = (by_category[g.category] ?? 0) + 1;
    }
    return {
      saved_grants: filtered.map((g: Record<string, unknown>) => ({
        id: g.id,
        grant_id: g.id,
        title: g.title,
        agency: g.agency,
        description: g.description,
        eligibility: g.eligibility,
        category: g.category,
        award_amount: g.award_amount,
        deadline: g.deadline,
        url: g.url,
        opportunity_number: g.opportunity_number,
        is_favorite: g.is_favorite ?? false,
        status: g.status ?? 'saved',
      })),
      total: filtered.length,
      total_count: filtered.length,
      total_saved: all.length,
      favorites_count: favoritesCount,
      favorites: favoritesCount,
      by_category,
      by_status: {},
    };
  },

  delete: async (grantId: string, _token?: string) => {
    return fetchWithError('/api/v1/saved', {
      method: 'DELETE',
      body: JSON.stringify({ grantId }),
    });
  },

  stats: async (_token?: string) => {
    const res = await fetchWithError('/api/v1/saved');
    const grants: { is_favorite: boolean; category?: string; status?: string }[] = res?.saved_grants ?? [];
    const by_category: Record<string, number> = {};
    let favorites = 0;
    for (const g of grants) {
      if (g.category) by_category[g.category] = (by_category[g.category] ?? 0) + 1;
      if (g.is_favorite) favorites++;
    }
    return {
      total_saved: grants.length,
      favorites,
      by_category,
      by_status: {},
    };
  },

  checkSaved: async (grantId: string, _token?: string) => {
    try {
      const res = await fetchWithError('/api/v1/saved');
      const grants: { id: string }[] = res?.saved_grants ?? [];
      const found = grants.find((g) => g.id === grantId);
      return { is_saved: !!found, saved_grant_id: found?.id ?? null };
    } catch {
      return { is_saved: false, saved_grant_id: null };
    }
  },

  search: async (searchQuery: string, _token?: string) => {
    const res = await fetchWithError('/api/v1/saved');
    const grants: { title?: string; agency?: string }[] = res?.saved_grants ?? [];
    const q = searchQuery.toLowerCase();
    const results = grants.filter(
      (g) => g.title?.toLowerCase().includes(q) || g.agency?.toLowerCase().includes(q),
    );
    return { saved_grants: results, total: results.length };
  },

  toggleFavorite: async (_savedGrantId: string | number, _token?: string) => {
    // Favorites are not yet stored in KV — return a no-op response
    return { ok: true };
  },
};
