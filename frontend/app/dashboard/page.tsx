'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../lib/store';
import { useProfileStore } from '../../lib/profile-store';
import { grantsApi, savedGrantsApi } from '../../lib/api';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

// Helper function for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    console.error('API Error:', error);
    throw error;
  }
};

export default function DashboardPage() {
  // Dashboard page component
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, token } = useAuthStore();
  const { profile } = useProfileStore();

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

  const { data: recommendedResults, isLoading } = useQuery({
    queryKey: ['recommended-grants', profile?.focus_areas, profile?.organization_type, profile?.keywords, profile?.location_state, profile?.grant_amount_min, profile?.grant_amount_max],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      // Build query string with profile data if available
      const query = personalizedQuery || 'federal grants USA';
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('q', query);
      if (profile?.grant_amount_min) searchParams.append('min_amount', profile.grant_amount_min.toString());
      if (profile?.grant_amount_max) searchParams.append('max_amount', profile.grant_amount_max.toString());
      
      console.log('Fetching personalized recommendations with query:', query);
      const url = `${API_BASE_URL}/api/v1/grants/recommended?${searchParams}`;
      const response = await fetchWithError(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Recommendations response:', response);
      console.log('Grants in response:', response?.grants);
      console.log('Grants count:', response?.grants?.length);
      return response;
    },
    enabled: isAuthenticated && !!token && !!profile && (!!profile.focus_areas?.length || !!profile.organization_type || !!profile.keywords?.length), // Only fetch when profile has relevant data
    refetchOnWindowFocus: true, // Refetch when user comes back to page
    });

  // Get saved grants statistics
  const { data: savedGrantsStats } = useQuery({
    queryKey: ['saved-grants-stats'],
    queryFn: async () => {
      const response = await savedGrantsApi.stats(token || undefined);
      return response;
    },
    enabled: isAuthenticated,
  });

  // Refetch recommendations when profile changes
  useEffect(() => {
    if (profile && isAuthenticated && token) {
      // When profile changes, invalidate and refetch recommendations
      queryClient.invalidateQueries({ queryKey: ['recommended-grants'] });
    }
  }, [profile?.focus_areas, profile?.organization_type, profile?.keywords, profile?.location_state, profile?.grant_amount_min, profile?.grant_amount_max, isAuthenticated, token, queryClient]);
  
  const recommendedGrants = recommendedResults?.grants || [];
  const providersUsed = recommendedResults?.providers_used || [];
  const isPersonalized = recommendedResults?.personalized || false;
  
  // Debug logging
  console.log('recommendedResults:', recommendedResults);
  console.log('recommendedGrants:', recommendedGrants);
  console.log('recommendedGrants.length:', recommendedGrants.length);


  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Matches
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                AI recommendations available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Searches
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">∞</div>
              <p className="text-xs text-muted-foreground">
                Unlimited searches
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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

          <Link href="/saved">
            <Card className="hover:border-foreground transition-colors cursor-pointer h-full border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Saved Grants</CardTitle>
                <CardDescription>
                  View and manage your bookmarked grants
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/search">
            <Card className="hover:border-foreground transition-colors cursor-pointer h-full border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Get personalized grant recommendations
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
              <Link href="/search">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

