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

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/grants/${id}`);
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

  list: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/saved-grants`, {
      headers: { Authorization: `Bearer ${token}` },
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
};
