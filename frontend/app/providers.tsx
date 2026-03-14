'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useProfileStore } from '@/lib/profile-store';

/**
 * Keeps the legacy Zustand auth store in sync with the NextAuth session,
 * and triggers initial data fetches (profile, saved grants) on sign-in.
 */
function SessionSync() {
  const { data: session, status } = useSession();
  const { setAuth, clearAuth, setAuthReady } = useAuthStore();
  const { fetchProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user?.email) {
      setAuth(
        {
          id: session.user.id ?? session.user.email,
          email: session.user.email,
          name: session.user.name ?? '',
          tier: 'premium',
        },
        'nextauth-session',
      );
      // Hydrate profile from server on sign-in
      fetchProfile();
    } else if (status === 'unauthenticated') {
      clearAuth();
      clearProfile();
    }

    // Signal that auth state is now resolved so pages can safely redirect
    setAuthReady();
  }, [status, session, setAuth, clearAuth, setAuthReady, fetchProfile, clearProfile]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionSync />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
