'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register({ full_name: fullName, email, password });
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Create account
            </h1>
            <p className="text-muted-foreground">
              Join Nexar AI to discover grants
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium block">
                Full name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name..."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium block">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium block">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
