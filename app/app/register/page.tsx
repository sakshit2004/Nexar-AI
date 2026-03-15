'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, ArrowRight, Zap, Check } from 'lucide-react';
import {
  isValidEmail,
  getPasswordStrength,
  validatePassword,
} from '../../lib/validation';

const BENEFITS = [
  'AI-powered matching across federal, state & foundation grants',
  'Plain-English summaries of complex requirements',
  'Know your eligibility before you apply',
  'Fully open source — free to use, fork, and contribute',
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [emailFocused, setEmailFocused] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const nameError = touched.name && (!name.trim() || name.trim().length < 2);
  // Only show email error after blur (when user has finished typing), not while typing
  const emailError = touched.email && !emailFocused && email && !isValidEmail(email);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordError = touched.password && password && !passwordValidation.valid;
  const isFormValid =
    name.trim().length >= 2 &&
    isValidEmail(email) &&
    passwordValidation.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true });

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      setError(pwdCheck.message || 'Please choose a stronger password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created, but sign-in failed. Please sign in manually.');
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="h-5 w-5" />
            Nexar AI
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold leading-snug">
            Stop missing grants.<br />Start winning them.
          </h2>
          <ul className="space-y-3">
            {BENEFITS.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-background/80">
                <div className="mt-0.5 rounded-full bg-background/20 p-0.5 flex-shrink-0">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-background/60 text-sm">
          <span>Open source</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-10 lg:hidden">
            <Zap className="h-5 w-5" />
            Nexar AI
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start discovering grants for free today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium block">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={`h-11 ${nameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                required
                disabled={loading}
                autoFocus
                aria-invalid={nameError}
                aria-describedby={nameError ? 'name-error' : undefined}
              />
              {nameError && (
                <p id="name-error" className="text-sm text-destructive">
                  Please enter a valid name (at least 2 characters).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium block">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setTouched((t) => ({ ...t, email: true }));
                }}
                className={`h-11 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
                disabled={loading}
                aria-invalid={emailError ? "true" : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium block">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters, uppercase, lowercase, number & symbol"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`h-11 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                required
                disabled={loading}
                aria-invalid={passwordError ? "true" : undefined}
                aria-describedby={password ? 'password-strength' : undefined}
              />
              {password && (
                <div id="password-strength" className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 'weak'
                            ? 'bg-destructive'
                            : passwordStrength.strength === 'fair'
                              ? 'bg-amber-500'
                              : passwordStrength.strength === 'good'
                                ? 'bg-lime-500'
                                : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium w-12 shrink-0 ${
                        passwordStrength.strength === 'strong'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <span className={passwordStrength.criteria.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                      {passwordStrength.criteria.length ? <Check className="inline h-3 w-3 mr-0.5" /> : '○'} 8+
                    </span>
                    <span className={passwordStrength.criteria.uppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                      {passwordStrength.criteria.uppercase ? <Check className="inline h-3 w-3 mr-0.5" /> : '○'} upper
                    </span>
                    <span className={passwordStrength.criteria.lowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                      {passwordStrength.criteria.lowercase ? <Check className="inline h-3 w-3 mr-0.5" /> : '○'} lower
                    </span>
                    <span className={passwordStrength.criteria.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                      {passwordStrength.criteria.number ? <Check className="inline h-3 w-3 mr-0.5" /> : '○'} num
                    </span>
                    <span className={passwordStrength.criteria.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                      {passwordStrength.criteria.special ? <Check className="inline h-3 w-3 mr-0.5" /> : '○'} symbol
                    </span>
                  </div>
                </div>
              )}
              {passwordError && (
                <p className="text-sm text-destructive">
                  {passwordValidation.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Creating account...' : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
