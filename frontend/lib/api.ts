const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

// Utility function for API calls with error handling
const fetchWithError = async (url: string, options?: RequestInit) => {
  try {
    if (DEBUG) console.log('API Call:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
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
    min_amount?: number;
    max_amount?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/search?${searchParams}`);
    return response;
  },

  getById: async (id: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/${id}`, { headers });
    return response;
  },

  getRecommendations: async (token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/recommended`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
};

// Matching API
export const matchingApi = {
  getMatch: async (grantId: string, token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/${grantId}/match`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  analyze: async (grantId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/${grantId}/analyze`, {
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
        // Parse award amount range (e.g., "$50,000 - $500,000")
        const amountMatch = grantData.award_amount.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
        if (amountMatch) {
          body.grant_award_floor = parseInt(amountMatch[1].replace(/,/g, ''));
          body.grant_award_ceiling = parseInt(amountMatch[2].replace(/,/g, ''));
        }
      }
      if (grantData.deadline) body.grant_close_date = grantData.deadline;
      if (grantData.url) body.grant_url = grantData.url;
      if (grantData.opportunity_number) body.grant_cfda_number = grantData.opportunity_number;
    }
    
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants`, {
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
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants?${searchParams}`, {
      headers,
    });
    return response;
  },

  delete: async (savedGrantId: string, token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  stats: async (token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/stats`, {
      headers,
    });
    return response;
  },

  checkSaved: async (grantId: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/check/${grantId}`, {
      headers,
    });
    return response;
  },

  search: async (searchQuery: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/search?q=${encodeURIComponent(searchQuery)}`, {
      headers,
    });
    return response;
  },

  toggleFavorite: async (savedGrantId: string | number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}/favorite`, {
      method: 'PUT',
      headers,
    });
    return response;
  },

  archive: async (savedGrantId: string | number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}/archive`, {
      method: 'PUT',
      headers,
    });
    return response;
  },
};
