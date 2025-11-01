'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Auto-login with demo user and redirect to search
    authApi.login('demo@example.com', 'demo123')
      .then((response) => {
        const { access_token, user } = response.data;
        setAuth(user, access_token);
        router.push('/search');
      })
      .catch(() => {
        router.push('/search');
      });
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
