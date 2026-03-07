'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../lib/store';
import { useProfileStore } from '../../lib/profile-store';
import { MLH_DEFAULT_PROFILE } from '../../lib/mlh-defaults';
import { AlertCircle, Info } from 'lucide-react';

// Hardcoded credentials
const CREDENTIALS = [
  { email: 'admin@nexar.ai', password: 'admin123', name: 'Admin User' },
  { email: 'admin@mlh.com', password: 'mlh', name: 'MLH Fellow' },
] as const;

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

    // Second step: submit login with hardcoded authentication
    setError('');
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check hardcoded credentials
    const match = CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (match) {
      // Create mock user and token
      const mockUser = {
        id: '1',
        email: match.email,
        name: match.name,
        tier: 'premium' as const,
      };
      const mockToken = 'hardcoded-auth-token';

      // Seed MLH profile when logging in as MLH Fellow (so it's set before navigation and not overwritten by rehydration)
      if (match.email === 'admin@mlh.com') {
        const { profile, updateProfile } = useProfileStore.getState();
        const profileEmpty = !profile?.organization_name && !profile?.focus_areas?.length;
        if (profileEmpty) {
          updateProfile(MLH_DEFAULT_PROFILE);
        }
      }
      
      setAuth(mockUser, mockToken);
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }
    
    setLoading(false);
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

            {/* Major League Hacking (MLH) Fellowship sign-in hint */}
            <div className="mt-6 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-left">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="space-y-1.5 text-sm">
                  <p className="font-medium text-foreground">
                    Major League Hacking (MLH) Fellowship
                  </p>
                  <p className="text-muted-foreground">
                    Use email <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-xs">admin@mlh.com</code> and password <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-xs">mlh</code>
                  </p>
                  <p className="text-muted-foreground">
                    <a href="https://fellowship.mlh.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      Learn more
                    </a>
                  </p>
                </div>
              </div>
            </div>
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
                <label htmlFor="password" className="text-sm font-medium block">
                  Password
                </label>
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
