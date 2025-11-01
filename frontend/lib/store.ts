import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'premium';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (user && token) {
          set({ user, token, isAuthenticated: true });
        }
      },
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      // Skip hydration issues on SSR
      skipHydration: true,
    }
  )
);

// Handle hydration on client side
if (typeof window !== 'undefined') {
  useAuthStore.persist.rehydrate();
}
