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
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/grants/search?${searchParams}`);
    return response;
  },

  getById: async (id: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/grants/${id}`, { headers });
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
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/grants/${grantId}/match`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  analyze: async (grantId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/grants/${grantId}/analyze`, {
      method: 'POST',
      headers,
    });
    return response;
  },
};

// Saved Grants API
export const savedGrantsApi = {
  save: async (grantId: string, token: string, grantData?: any) => {
    // Build the request body with required fields
    const body: any = {
      grant_id: grantId,
      grant_title: grantData?.title || `Grant ${grantId}`,
    };
    
    // Add optional fields if grant data is provided
    if (grantData) {
      if (grantData.agency) body.grant_agency = grantData.agency;
      if (grantData.description) body.grant_description = grantData.description;
      if (grantData.eligibility) body.grant_eligibility = grantData.eligibility;
      if (grantData.category) body.grant_category = grantData.category;
      if (grantData.award_amount) {
        body.grant_award_amount = grantData.award_amount;
        const amountMatch = String(grantData.award_amount).match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
        if (amountMatch) {
          body.grant_award_floor = parseInt(amountMatch[1].replace(/,/g, ''), 10);
          body.grant_award_ceiling = parseInt(amountMatch[2].replace(/,/g, ''), 10);
        }
      }
      if (grantData.deadline) body.grant_close_date = grantData.deadline;
      if (grantData.url) body.grant_url = grantData.url;
      if (grantData.opportunity_number) body.grant_cfda_number = grantData.opportunity_number;
    }
    
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  },

  list: async (token?: string, params?: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants?${searchParams}`, {
      headers,
    });
    return response;
  },

  delete: async (savedGrantId: string, token: string) => {
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants/${savedGrantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  stats: async (token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants/stats`, {
      headers,
    });
    return response;
  },

  checkSaved: async (grantId: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants/check/${grantId}`, {
      headers,
    });
    return response;
  },

  search: async (searchQuery: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants/search?q=${encodeURIComponent(searchQuery)}`, {
      headers,
    });
    return response;
  },

  toggleFavorite: async (savedGrantId: string | number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${getApiBaseUrl()}/api/v1/saved-grants/${savedGrantId}/toggle-favorite`, {
      method: 'POST',
      headers,
    });
    return response;
  },

};
