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
  const [step, setStep] = useState(1); // 1 = email, 2 = details
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      // Move to step 2
      setStep(2);
      return;
    }

    // Step 2: Submit registration
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register(formData);
      const { access_token, user } = response.data;
      
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="font-bold text-xl">
          Nexar AI
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Get started with Nexar AI
            </h1>
            <p className="text-muted-foreground">
              Create your free account
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

            {/* Step 1: Email */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium block">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Use an email you'll always have access to
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-medium block">
                    Full name
                  </label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name..."
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-11"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium block">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Continue'}
            </Button>

            {/* Divider - Only show on step 1 */}
            {step === 1 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Social Auth (Placeholders) */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-normal"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-normal"
                    disabled
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </Button>
                </div>
              </>
            )}

            {/* Back button for step 2 */}
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            )}
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* Terms */}
          {step === 2 && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our{' '}
              <a href="#" className="hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="hover:underline">Privacy Policy</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
