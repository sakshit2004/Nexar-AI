'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    // Auto-login with demo user and redirect to search
    login('demo@example.com', 'demo123')
      .then(() => {
        router.push('/search');
      })
      .catch(() => {
        router.push('/search');
      });
  }, [router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
