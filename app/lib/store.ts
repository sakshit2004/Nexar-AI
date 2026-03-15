/**
 * Auth store — thin Zustand wrapper around the NextAuth session.
 *
 * Pages that need the current user should prefer `useSession()` from
 * `next-auth/react` directly. This store exists to preserve backwards
 * compatibility with components that already import `useAuthStore`.
 *
 * `syncFromSession(session)` is called by the SessionSync component
 * in providers.tsx to keep this store in sync with NextAuth.
 */

import { create } from 'zustand';

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
  /**
   * Becomes `true` once SessionSync has observed the first non-loading NextAuth
   * status. Pages should wait for this before redirecting to /login so that
   * already-signed-in users are not bounced on full page load.
   */
  authReady: boolean;
  /** Called by SessionSync whenever the NextAuth session changes. */
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  /** Marks auth state as resolved (called by SessionSync after first status). */
  setAuthReady: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  authReady: false,

  setAuth: (user, token) => {
    if (user && token) {
      set({ user, token, isAuthenticated: true });
    }
  },

  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false, authReady: false });
  },

  setAuthReady: () => {
    set((state) => (state.authReady ? state : { authReady: true }));
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    // Delegate to NextAuth signOut — dynamic import avoids SSR issues.
    if (typeof window !== 'undefined') {
      import('next-auth/react').then(({ signOut }) => {
        signOut({ callbackUrl: '/' });
      });
    }
  },
}));
