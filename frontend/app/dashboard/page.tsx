'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../lib/store';
import { useProfileStore, type OrganizationProfile } from '../../lib/profile-store';
import { grantsApi, savedGrantsApi } from '../../lib/api';
import { 
  Search, 
  Clock, 
  DollarSign,
  ArrowRight,
  Loader2,
  Sparkles,
  RefreshCw,
  Bookmark,
  User,
  MapPin,
  Target,
  Building
} from 'lucide-react';
import { OnboardingTour } from '../../components/OnboardingTour';

const RECOMMENDED_LOADING_MESSAGES = [
  'Finding the best grants for your business...',
  'Matching grants to your profile...',
  'Searching federal opportunities...',
  'Discovering grants that fit your focus areas...',
  'Scanning open funding opportunities...',
];

/** Returns a time-of-day appropriate greeting string. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Calculates profile completion percentage and lists missing fields. */
function getProfileCompletion(profile: OrganizationProfile | null): { percentage: number; missing: string[] } {
  if (!profile) return { percentage: 0, missing: ['Complete your profile to get started'] };
  const fields = [
    { key: 'full_name', label: 'Full name' },
    { key: 'organization_name', label: 'Organization name' },
    { key: 'organization_type', label: 'Organization type' },
    { key: 'focus_areas', label: 'Focus areas', isArray: true },
    { key: 'location_state', label: 'Location' },
    { key: 'keywords', label: 'Keywords', isArray: true },
  ];
  const missing: string[] = [];
  let filled = 0;
  for (const f of fields) {
    const val = profile[f.key as keyof OrganizationProfile];
    if (f.isArray ? val && Array.isArray(val) && val.length > 0 : val) {
      filled++;
    } else {
      missing.push(f.label);
    }
  }
  return { percentage: Math.round((filled / fields.length) * 100), missing };
}

export default function DashboardPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { isAuthenticated, user, token } = useAuthStore();
  const { profile, hydrated: profileHydrated, updateProfile } = useProfileStore();

  // refreshSeed changes each manual refresh so the query key is unique → fresh backend call
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Redirect to login if not authenticated — wait for session hydration first
  // to avoid bouncing users to /login while NextAuth resolves the JWT on refresh.
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated' && !isAuthenticated) {
      router.push('/login');
    }
  }, [sessionStatus, isAuthenticated, router]);

  // Show the interactive onboarding tour for new users who haven't completed onboarding
  const showOnboardingTour = profileHydrated && profile && !profile.onboarding_completed;

  const handleCompleteOnboarding = async () => {
    try {
      await updateProfile({ onboarding_completed: true });
    } catch {
      // Best-effort — will sync on next mount
    }
  };

  // Build personalized query based on profile
  const personalizedQuery = useMemo(() => {
    if (!profile) return undefined;
    
    const parts: string[] = [];
    
    if (profile.focus_areas && profile.focus_areas.length > 0) {
      parts.push(...profile.focus_areas.slice(0, 3));
    }
    
    if (profile.organization_type) {
      parts.push(profile.organization_type);
    }
    
    if (profile.keywords && profile.keywords.length > 0) {
      parts.push(...profile.keywords.slice(0, 2));
    }
    
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
      const response = await grantsApi.getRecommendations(token, {
        q: query,
        min_amount: profile?.grant_amount_min ?? undefined,
        max_amount: profile?.grant_amount_max ?? undefined,
        seed: refreshSeed > 0 ? refreshSeed : undefined,
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
  
  const apiUnreachable = isRecommendationsError || isSavedStatsError;

  const profileCompletion = getProfileCompletion(profile);
  const displayName = profile?.full_name || user?.name?.split(' ')[0] || user?.name || 'there';

  return (
    <div className="min-h-screen bg-background pt-20">
      <Suspense fallback={null}>
        <OnboardingTour
          forceShow={showOnboardingTour ?? false}
          onComplete={handleCompleteOnboarding}
        />
      </Suspense>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiUnreachable && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {recommendationsError?.message || 'Could not load recommendations. Check that OPENAI_API_KEY or ANTHROPIC_API_KEY is set.'}
          </div>
        )}

        {/* Header with greeting */}
        <div className="mb-8 animate-stagger-in">
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-bold mb-2">
            {showOnboardingTour ? `Welcome, ${displayName} 👋` : `Welcome back, ${displayName} 👋`}
          </h1>
          <p className="text-muted-foreground">
            {profile?.organization_name 
              ? `${profile.organization_name} · Here's your grant discovery overview`
              : "Here's your grant discovery overview"}
          </p>
        </div>

        {/* Profile completion bar — shows when profile is incomplete */}
        {profile && profileCompletion.percentage < 100 && (
          <div className="mb-8 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Profile completion</span>
                  </div>
                  <span className="text-sm font-semibold">{profileCompletion.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-foreground animate-progress-fill"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Add {profileCompletion.missing.slice(0, 2).join(', ').toLowerCase()} for better matches
                  </p>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      Complete Profile
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Link href="/saved" className="animate-stagger-in" style={{ animationDelay: '0.15s' }} data-tour="onboarding-saved-card">
            <Card className="interactive-card cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saved Grants
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold stat-number">{savedGrantsStats?.total_saved || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(savedGrantsStats?.total_saved ?? 0) > 0 ? 'Grants bookmarked' : 'Bookmark grants to track them'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/search" className="animate-stagger-in" style={{ animationDelay: '0.2s' }} data-tour="onboarding-search-card">
            <Card className="interactive-card cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Search Grants
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Find federal grants matching your criteria
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm font-medium">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="animate-stagger-in" style={{ animationDelay: '0.25s' }} data-tour="onboarding-profile-card">
            <Card className="interactive-card cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Profile
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold stat-number">{profileCompletion.percentage}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Profile complete
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Profile snapshot — compact inline view when profile is filled */}
        {profile && (profile.organization_name || profile.focus_areas?.length > 0) && profileCompletion.percentage === 100 && (
          <div className="mb-8 animate-stagger-in" style={{ animationDelay: '0.3s' }}>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm flex-wrap">
                    {profile.organization_name && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{profile.organization_name}</span>
                      </span>
                    )}
                    {profile.organization_type && (
                      <Badge variant="secondary" className="capitalize">{profile.organization_type}</Badge>
                    )}
                    {profile.location_state && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location_state}
                        {profile.location_county && `, ${profile.location_county}`}
                      </span>
                    )}
                    {profile.focus_areas && profile.focus_areas.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {profile.focus_areas.slice(0, 3).map((area: string) => (
                          <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                        ))}
                        {profile.focus_areas.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{profile.focus_areas.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommended Grants */}
        <div className="animate-stagger-in" style={{ animationDelay: '0.35s' }} data-tour="onboarding-recommended">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Recommended for You
                    {isPersonalized && (
                      <Badge variant="secondary" className="text-xs font-normal">Personalized</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {profile && (profile.focus_areas?.length > 0 || profile.organization_type || profile.keywords?.length > 0)
                      ? `Based on your profile: ${[profile.organization_type, ...(profile.focus_areas?.slice(0, 2) || [])].filter(Boolean).join(', ')}`.trim()
                      : 'Complete your profile to get personalized recommendations'}
                  </CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefreshSeed(s => s + 1)}
                    disabled={isLoading || isFetching}
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline ml-2">{isFetching ? 'Loading...' : 'Refresh'}</span>
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
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mb-2 text-lg">Complete Your Profile</h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Add your organization details, focus areas, and keywords to get AI-powered grant recommendations tailored to you
                  </p>
                  <Link href="/profile">
                    <Button size="lg">
                      <User className="mr-2 h-4 w-4" />
                      Set Up Profile
                    </Button>
                  </Link>
                </div>
              ) : isLoading || isFetching ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-muted" />
                    <Loader2 className="h-12 w-12 animate-spin text-foreground absolute inset-0" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center animate-fade-in">
                    {RECOMMENDED_LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                </div>
              ) : isRecommendationsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {recommendationsError?.message || 'Could not load recommendations. Make sure OPENAI_API_KEY or ANTHROPIC_API_KEY is set.'}
                  </p>
                </div>
              ) : recommendedGrants && recommendedGrants.length > 0 ? (
                <div className="space-y-3">
                  {recommendedGrants.slice(0, 3).map((grant: any, index: number) => (
                    <Link 
                      key={grant.id} 
                      href={`/grants/${grant.id}`}
                      onClick={() => { try { sessionStorage.setItem(`grant_${grant.id}`, JSON.stringify(grant)); } catch {} }}
                      className="block group"
                    >
                      <div className="p-4 rounded-lg border interactive-card">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm group-hover:text-foreground transition-colors">{grant.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {grant.description}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">{grant.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {grant.award_amount || 'Varies'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Due {new Date(grant.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View details <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mb-2">
                    No recommendations yet
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Check back later for new grant matches or search for grants now
                  </p>
                  <Link href="/search">
                    <Button>
                      <Search className="mr-2 h-4 w-4" />
                      Browse All Grants
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}