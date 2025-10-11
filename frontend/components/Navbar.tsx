'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { Sparkles, Search, User, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <span className="gradient-text">GrantMatch</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/search' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Search className="inline h-4 w-4 mr-1" />
                  Search Grants
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <User className="inline h-4 w-4 mr-1" />
                  Profile
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.full_name}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

