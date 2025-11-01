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

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return response;
  },

  me: async (token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
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
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/grants/recommendations`, {
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
      headers,
    });
    return response;
  },
};

// Profile API
export const profileApi = {
  get: async (token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  update: async (data: any, token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response;
  },
};

// Saved Grants API
export const savedGrantsApi = {
  save: async (grantId: string, token: string) => {
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ grant_id: grantId }),
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
    const response = await fetchWithError(`${API_BASE_URL}/api/v1/saved-grants/${grantId}/check`, {
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
