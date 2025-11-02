'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Auto-login with hardcoded user and redirect to dashboard
    const mockUser = {
      id: '1',
      email: 'admin@nexar.ai',
      name: 'Admin User',
      tier: 'premium' as const,
    };
    const mockToken = 'hardcoded-auth-token';
    setAuth(mockUser, mockToken);
    router.push('/dashboard');
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
