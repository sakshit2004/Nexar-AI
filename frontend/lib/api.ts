const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

/** In production, use same origin when NEXT_PUBLIC_API_URL is not set so the app works on Vercel without env. */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:8000';
}

/** When using a separate API project (NEXT_PUBLIC_API_URL set), the API has one entry /api/index; we send path via X-Original-URL. */
function isExternalApi(): boolean {
  if (!process.env.NEXT_PUBLIC_API_URL) return false;
  if (typeof window === 'undefined') return true;
  try {
    const apiOrigin = new URL(getApiBaseUrl()).origin;
    return apiOrigin !== window.location.origin;
  } catch {
    return true;
  }
}

function apiRequest(pathAndQuery: string, options?: RequestInit): { url: string; options: RequestInit } {
  const base = getApiBaseUrl();
  const fullUrl = `${base}${pathAndQuery.startsWith('/') ? '' : '/'}${pathAndQuery}`;
  if (isExternalApi()) {
    return {
      url: `${base}/api/index`,
      options: {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Original-URL': fullUrl,
          ...options?.headers,
        },
      },
    };
  }
  return {
    url: fullUrl,
    options: { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } },
  };
}

const fetchWithError = async (urlOrPath: string, options?: RequestInit) => {
  const base = getApiBaseUrl();
  const pathAndQuery = urlOrPath.startsWith('http')
    ? urlOrPath.replace(base.replace(/\/$/, ''), '').replace(/^\//, '')
    : urlOrPath.replace(/^\//, '');
  const pathNorm = `/${pathAndQuery}`;
  const { url, options: opts } = apiRequest(pathNorm, options);
  try {
    if (DEBUG) console.log('API Call:', url);

    const response = await fetch(url, opts);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let detail = typeof error?.detail === 'string' ? error.detail : Array.isArray(error?.detail) ? error.detail.map((x: any) => x?.msg ?? x).join(', ') : null;
      if (detail && (detail.trimStart().startsWith('<') || detail.includes('<!DOCTYPE'))) {
        detail = response.status === 500
          ? 'Server error. On Vercel: use a separate API project and set NEXT_PUBLIC_API_URL (see DEPLOYMENT_CHECKLIST.md).'
          : `API Error: ${response.status}`;
      }
      throw new Error(detail || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      throw new Error(`Could not reach the backend at ${base}. Make sure it's running (e.g. \`python -m backend.main\`) or set NEXT_PUBLIC_API_URL to your API project URL.`);
    }
    if (DEBUG) console.error('API Error:', error);
    throw error;
  }
};

// Grants API
export const grantsApi = {
  search: async (params: {
    q?: string;
    category?: string;
    min_amount?: number;
    max_amount?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const response = await fetchWithError(`/api/v1/grants/search?${searchParams}`);
    return response;
  },

  getById: async (id: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`/api/v1/grants/${id}`, { headers });
    return response;
  },

  getRecommendations: async (
    token: string,
    params?: { q?: string; min_amount?: number; max_amount?: number; seed?: number }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.min_amount != null) searchParams.append('min_amount', String(params.min_amount));
    if (params?.max_amount != null) searchParams.append('max_amount', String(params.max_amount));
    if (params?.seed != null) searchParams.append('seed', String(params.seed));
    const qs = searchParams.toString();
    const path = `/api/v1/grants/recommended${qs ? `?${qs}` : ''}`;
    const response = await fetchWithError(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
};

// Matching API
export const matchingApi = {
  getMatch: async (grantId: string, token: string) => {
    const response = await fetchWithError(`/api/v1/grants/${grantId}/match`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  analyze: async (grantId: string, token?: string, grantData?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const body = grantData ? JSON.stringify({ grant: grantData }) : undefined;
    const response = await fetchWithError(`/api/v1/grants/${grantId}/analyze`, {
      method: 'POST',
      headers,
      body,
    });
    return response;
  },
};

// Saved Grants API — backed by localStorage, no network calls needed
export const savedGrantsApi = {
  save: async (_token: string, grantData: any) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    return savedGrantsStore.add({
      grant_id: grantData?.id || grantData?.grant_id || '',
      grant_title: grantData?.title || grantData?.grant_title || 'Untitled Grant',
      grant_agency: grantData?.agency,
      grant_description: grantData?.description,
      grant_eligibility: grantData?.eligibility,
      grant_category: grantData?.category,
      grant_award_amount: grantData?.award_amount,
      grant_close_date: grantData?.deadline,
      grant_url: grantData?.url,
      grant_cfda_number: grantData?.opportunity_number,
    });
  },

  list: async (_token?: string, params?: { favorites_only?: boolean }) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    const grants = savedGrantsStore.list(params);
    const all = savedGrantsStore.list();
    const favoritesCount = all.filter((g) => g.is_favorite).length;
    return {
      saved_grants: grants.map((g) => ({
        id: g.id,
        grant_id: g.grant_id,
        title: g.grant_title,
        agency: g.grant_agency,
        description: g.grant_description,
        eligibility: g.grant_eligibility,
        category: g.grant_category,
        award_amount: g.grant_award_amount,
        deadline: g.grant_close_date,
        url: g.grant_url,
        opportunity_number: g.grant_cfda_number,
        is_favorite: g.is_favorite,
        status: g.status,
      })),
      total: grants.length,
      total_count: grants.length,
      favorites_count: favoritesCount,
    };
  },

  delete: async (savedGrantId: string, _token: string) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    savedGrantsStore.remove(savedGrantId);
    return { success: true };
  },

  stats: async (_token?: string) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    return savedGrantsStore.stats();
  },

  checkSaved: async (grantId: string, _token?: string) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    const grant = savedGrantsStore.get(grantId);
    return { is_saved: !!grant, saved_grant_id: grant?.id ?? null };
  },

  search: async (searchQuery: string, _token?: string) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    const q = searchQuery.toLowerCase();
    const results = savedGrantsStore.list().filter(
      (g) => g.grant_title?.toLowerCase().includes(q) || g.grant_agency?.toLowerCase().includes(q)
    );
    return { saved_grants: results, total: results.length };
  },

  toggleFavorite: async (savedGrantId: string | number, _token?: string) => {
    const { savedGrantsStore } = await import('./saved-grants-store');
    return savedGrantsStore.toggleFavorite(savedGrantId) ?? { error: 'Not found' };
  },

};
