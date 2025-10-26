const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  },

  me: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
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
    
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/search?${searchParams}`);
    return response.json();
  },

  getById: async (id: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/${id}`, { headers });
    return response.json();
  },

  getRecommendations: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Matching API
export const matchingApi = {
  getMatch: async (grantId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/${grantId}/match`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  analyze: async (grantId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/${grantId}/analyze`, {
      headers,
    });
    return response.json();
  },
};

// Profile API
export const profileApi = {
  get: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  update: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Saved Grants API
export const savedGrantsApi = {
  save: async (grantId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ grant_id: grantId }),
    });
    return response.json();
  },

  list: async (token?: string, params?: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants?${searchParams}`, {
      headers,
    });
    return response.json();
  },

  delete: async (savedGrantId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  stats: async (token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/stats`, {
      headers,
    });
    return response.json();
  },

  checkSaved: async (grantId: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/${grantId}/check`, {
      headers,
    });
    return response.json();
  },

  search: async (searchQuery: string, token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/search?q=${encodeURIComponent(searchQuery)}`, {
      headers,
    });
    return response.json();
  },

  toggleFavorite: async (savedGrantId: string | number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}/favorite`, {
      method: 'PUT',
      headers,
    });
    return response.json();
  },

  archive: async (savedGrantId: string | number, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants/${savedGrantId}/archive`, {
      method: 'PUT',
      headers,
    });
    return response.json();
  },
};
