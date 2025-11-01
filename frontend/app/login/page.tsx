'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showPassword) {
      // First step: just show password field
      setShowPassword(true);
      return;
    }

    // Second step: submit login
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { access_token, user } = response.data;
      
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Sign in
            </h1>
            <p className="text-muted-foreground">
              Welcome back to Nexar AI
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleContinue} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
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
                autoFocus
              />
            </div>

            {/* Password (shown after email) */}
            {showPassword && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}

            {/* Continue Button */}
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
