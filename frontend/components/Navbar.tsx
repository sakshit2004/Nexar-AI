'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../lib/store';
import { useProfileStore } from '../lib/profile-store';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-xl border-b' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl transition-opacity hover:opacity-70">
              Nexar AI
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className={`text-sm transition-colors ${
                    pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className={`text-sm transition-colors ${
                    pathname === '/search' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Search
                </Link>
                <Link
                  href="/saved"
                  className={`text-sm transition-colors ${
                    pathname === '/saved' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Saved
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm transition-colors ${
                    pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Profile
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {profile?.full_name || profile?.organization_name || user?.name}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
