'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../lib/store';
import { useProfileStore } from '../../lib/profile-store';
import { MLH_DEFAULT_PROFILE, MLH_FELLOWSHIP_URL } from '../../lib/mlh-defaults';
import { grantsApi, savedGrantsApi } from '../../lib/api';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowRight,
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Helper function for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const RECOMMENDED_LOADING_MESSAGES = [
  'Finding the best grants for your business...',
  'Matching grants to your profile...',
  'Searching federal opportunities...',
  'Discovering grants that fit your focus areas...',
  'Scanning open funding opportunities...',
];

const fetchWithError = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      throw new Error(`Could not reach the backend. Make sure it's running (e.g. \`python -m backend.main\`) at ${baseUrl}`);
    }
    console.error('API Error:', error);
    throw error;
  }
};

export default function DashboardPage() {
  // Dashboard page component
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, token } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();

  // refreshSeed changes each manual refresh so the query key is unique → fresh backend call
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Seed MLH default profile when MLH Fellow has no profile (run after rehydration so persist doesn't overwrite)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.email === 'admin@mlh.com' && (!profile?.organization_name && !profile?.focus_areas?.length)) {
        updateProfile(MLH_DEFAULT_PROFILE);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user?.email, profile?.organization_name, profile?.focus_areas?.length, updateProfile]);

  // Auto-login with hardcoded user if not authenticated (unless just logged out)
  useEffect(() => {
    if (!isAuthenticated) {
      // Check if user just logged out - don't auto-login in that case
      const justLoggedOut = typeof window !== 'undefined' && sessionStorage.getItem('just-logged-out');
      if (justLoggedOut) {
        // Clear the flag and redirect to home instead of auto-login
        sessionStorage.removeItem('just-logged-out');
        router.push('/');
        return;
      }
      
      const { setAuth } = useAuthStore.getState();
      // Create hardcoded user for session-based approach
      const mockUser = {
        id: '1',
        email: 'admin@nexar.ai',
        name: 'Admin User',
        tier: 'premium' as const,
      };
      const mockToken = 'hardcoded-auth-token';
      setAuth(mockUser, mockToken);
    }
  }, [isAuthenticated, router]);

  // Build personalized query based on profile
  const personalizedQuery = useMemo(() => {
    if (!profile) return undefined;
    
    const parts: string[] = [];
    
    // Add focus areas first (most important for matching)
    if (profile.focus_areas && profile.focus_areas.length > 0) {
      // Take first 3 focus areas to keep query focused
      parts.push(...profile.focus_areas.slice(0, 3));
    }
    
    // Add organization type if specified
    if (profile.organization_type) {
      parts.push(profile.organization_type);
    }
    
    // Add top keywords if available
    if (profile.keywords && profile.keywords.length > 0) {
      // Take first 2 keywords
      parts.push(...profile.keywords.slice(0, 2));
    }
    
    // Build query - if we have any profile data, create personalized query
    if (parts.length > 0) {
      return `federal grants for ${parts.join(' ')}`;
    }
    
    return undefined;
  }, [profile]);

  const { data: recommendedResults, isLoading, isFetching, isError: isRecommendationsError, error: recommendationsError, refetch: refetchRecommendations } = useQuery({
    queryKey: ['recommended-grants', profile?.focus_areas, profile?.organization_type, profile?.keywords, profile?.location_state, profile?.grant_amount_min, profile?.grant_amount_max, refreshSeed],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      const query = personalizedQuery || 'federal grants USA';
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('q', query);
      if (profile?.grant_amount_min) searchParams.append('min_amount', profile.grant_amount_min.toString());
      if (profile?.grant_amount_max) searchParams.append('max_amount', profile.grant_amount_max.toString());
      // seed param makes each refresh a distinct request; backend ignores it but ensures no cache hits
      if (refreshSeed > 0) searchParams.append('seed', String(refreshSeed));
      
      const url = `${API_BASE_URL}/api/v1/grants/recommended?${searchParams}`;
      const response = await fetchWithError(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response;
    },
    enabled:
      isAuthenticated &&
      !!token &&
      !!profile &&
      (!!profile.focus_areas?.length || !!profile.organization_type || !!profile.keywords?.length),
    refetchOnMount: true,
    retry: false,
  });

  // Cycle through loading messages while recommendations are fetching
  useEffect(() => {
    if (!isLoading && !isFetching) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % RECOMMENDED_LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading, isFetching]);

  // Get saved grants statistics
  const { data: savedGrantsStats, isError: isSavedStatsError } = useQuery({
    queryKey: ['saved-grants-stats'],
    queryFn: async () => {
      const response = await savedGrantsApi.stats(token || undefined);
      return response;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const recommendedGrants = recommendedResults?.grants || [];
  const providersUsed = recommendedResults?.providers_used || [];
  const isPersonalized = recommendedResults?.personalized || false;
  
  // Debug logging
  const apiUnreachable = isRecommendationsError || isSavedStatsError;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiUnreachable && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {recommendationsError?.message || 'Could not reach the backend.'} Start the server with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">python -m backend.main</code> and refresh.
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || user?.name?.split(' ')[0] || user?.name || 'there'}
          </h1>
          <p className="text-muted-foreground">
            {profile?.organization_name 
              ? `${profile.organization_name} • Here's your grant discovery overview`
              : "Here's your grant discovery overview"}
          </p>
          {user?.email === 'admin@mlh.com' && (
            <p className="text-sm text-muted-foreground mt-1">
              Configured for{' '}
              <a href={MLH_FELLOWSHIP_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                MLH Fellowship
              </a>
            </p>
          )}
        </div>

        {/* Profile Info Card */}
        {profile && (profile.organization_name || profile.focus_areas?.length > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Current organization information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profile.organization_name && (
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="ml-2 font-medium">{profile.organization_name}</span>
                  </div>
                )}
                {profile.organization_type && (
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium capitalize">{profile.organization_type}</span>
                  </div>
                )}
                {profile.location_state && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="ml-2 font-medium">
                      {profile.location_state}
                      {profile.location_county && `, ${profile.location_county}`}
                    </span>
                  </div>
                )}
                {profile.focus_areas && profile.focus_areas.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Focus Areas:</span>
                    <span className="ml-2 font-medium">{profile.focus_areas.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Grants + Search Grants in one row */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Link href="/saved">
            <Card className="hover:border-foreground transition-colors cursor-pointer h-full border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saved Grants
                </CardTitle>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedGrantsStats?.total_saved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {savedGrantsStats?.total_saved > 0 ? 'Grants saved' : 'Bookmark grants to save'}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/search">
            <Card className="hover:border-foreground transition-colors cursor-pointer h-full border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Search Grants</CardTitle>
                <CardDescription>
                  Find federal grants matching your criteria
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recommended Grants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Recommended for You
                  {isPersonalized && <Sparkles className="h-4 w-4 text-primary" />}
                </CardTitle>
                <CardDescription>
                  {profile && (profile.focus_areas?.length > 0 || profile.organization_type || profile.keywords?.length > 0)
                    ? `Based on your profile: ${profile.organization_type || ''} ${profile.focus_areas?.join(', ') || ''} ${profile.keywords?.slice(0, 2).join(', ') || ''}`.trim()
                    : 'Complete your profile to get personalized recommendations'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefreshSeed(s => s + 1)}
                  disabled={isLoading || isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh grant opportunities
                    </>
                  )}
                </Button>
                <Link href="/search">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!profile || (!profile.focus_areas?.length && !profile.organization_type && !profile.keywords?.length) ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Complete Your Profile</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your organization details, focus areas, and keywords to get personalized grant recommendations
                </p>
                <Link href="/profile">
                  <Button>Go to Profile</Button>
                </Link>
              </div>
            ) : isLoading || isFetching ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center animate-in fade-in duration-300">
                  {RECOMMENDED_LOADING_MESSAGES[loadingMessageIndex]}
                </p>
              </div>
            ) : isRecommendationsError ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {recommendationsError?.message || 'Could not load recommendations.'} Make sure the backend is running.
                </p>
              </div>
            ) : recommendedGrants && recommendedGrants.length > 0 ? (
              <div className="space-y-4">
                {recommendedGrants.slice(0, 3).map((grant: any) => (
                  <Link 
                    key={grant.id} 
                    href={`/grants/${grant.id}`}
                    className="block p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{grant.title}</h4>
                      <Badge variant="secondary">{grant.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {grant.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {grant.award_amount || 'Varies'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {new Date(grant.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">
                  No recommendations yet
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Check back later for new grant matches or search for grants now
                </p>
                <Link href="/search">
                  <Button>Browse All Grants</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

