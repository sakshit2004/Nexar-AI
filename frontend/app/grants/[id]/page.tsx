'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { grantsApi, savedGrantsApi, matchingApi } from '@/lib/api';
import { 
  ArrowLeft,
  DollarSign,
  Clock,
  Building,
  Sparkles,
  Loader2,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Heart
} from 'lucide-react';

export default function GrantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const grantId = params.id as string;
  const { isAuthenticated, authReady, token } = useAuthStore();

  // Redirect to login if not authenticated (only after auth state is resolved)
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, isAuthenticated, router]);

  const { data: grant, isLoading, error } = useQuery({
    queryKey: ['grant', grantId],
    queryFn: async () => {
      // First check sessionStorage — grant data is stored there when navigating from search/dashboard
      if (typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem(`grant_${grantId}`);
          if (cached) return JSON.parse(cached);
        } catch { /* ignore */ }
      }
      // Fall back to API (works when same serverless instance as search)
      const response = await grantsApi.getById(grantId);
      const grantData = response?.data || response;
      if (!grantData) throw new Error('Grant data not found in response');
      return grantData;
    },
    enabled: isAuthenticated && !!grantId,
    retry: false,
  });

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedGrantId, setSavedGrantId] = useState<number | null>(null);

  // Check if grant is saved
  const { data: savedStatus } = useQuery({
    queryKey: ['grant-saved-status', grantId],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const response = await savedGrantsApi.checkSaved(grantId, token);
      return response;
    },
    enabled: isAuthenticated && !!grantId && !!token,
  });

  // Update saved status when data changes
  useEffect(() => {
    if (savedStatus) {
      setIsSaved(savedStatus.is_saved);
    }
  }, [savedStatus]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!grant) throw new Error('Grant data required');
      return matchingApi.analyze(grantId, token ?? undefined, grant);
    },
    onSuccess: (data) => {
      if (data) {
        setAiSummary(data.ai_summary || data.summary);
        setMatchData(data);
      }
    },
  });

  // Save grant mutation
  const saveGrantMutation = useMutation({
    mutationFn: async () => {
      if (!grant) throw new Error('Grant data not available');
      return savedGrantsApi.save(token ?? '', grant as Record<string, string>);
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['saved-grants'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants-stats'] });
    },
  });

  // Unsave grant mutation
  const unsaveGrantMutation = useMutation({
    mutationFn: async () => {
      await savedGrantsApi.delete(grantId, token ?? undefined);
    },
    onSuccess: () => {
      setIsSaved(false);
      setSavedGrantId(null);
      queryClient.invalidateQueries({ queryKey: ['saved-grants'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants-stats'] });
    },
  });


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error loading grant</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Link href="/search">
            <Button variant="outline">Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Grant not found</h2>
          <Link href="/search">
            <Button variant="outline">Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Back Button */}
        <Link href="/search">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        {/* Grant Header */}
        <div className="mb-8 animate-stagger-in">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3">{grant.category || 'General'}</Badge>
              <h1 className="text-3xl font-bold mb-3">{grant.title}</h1>
              <p className="text-muted-foreground text-lg">{grant.agency || 'Federal Agency'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm mt-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Award Amount</p>
                <p className="font-medium">{grant.award_amount || 'Varies'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="font-medium">{grant.deadline ? new Date(grant.deadline).toLocaleDateString() : 'Rolling'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opportunity #</p>
                <p className="font-medium">{grant.opportunity_number || grant.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{grant.description || 'No description available.'}</p>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card className="border-2 bg-muted">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-foreground" />
                  <CardTitle>Grant Summary</CardTitle>
                </div>
                <CardDescription>
                  Plain-English summary for easy understanding
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiSummary ? (
                  <div>
                    <p className="text-sm leading-relaxed mb-4">{aiSummary}</p>
                    <Button 
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Regenerate Summary
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a summary to understand this grant better
                    </p>
                    <Button 
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isPending}
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eligibility Scoring (shown after AI analysis) */}
            {matchData?.eligibility && (() => {
              const elig = matchData.eligibility as {
                status: 'eligible' | 'likely_eligible' | 'check_required' | 'ineligible';
                confidence: number;
                reasons: string[];
                missing_info: string[];
              };
              const badgeStyles: Record<string, string> = {
                eligible: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                likely_eligible: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                check_required: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
                ineligible: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
              };
              const statusLabels: Record<string, string> = {
                eligible: 'Eligible',
                likely_eligible: 'Likely Eligible',
                check_required: 'Check Required',
                ineligible: 'Not Eligible',
              };
              return (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Eligibility Assessment
                      </CardTitle>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeStyles[elig.status] ?? badgeStyles.check_required}`}>
                        {statusLabels[elig.status] ?? elig.status} · {elig.confidence}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {elig.reasons.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Key factors:</p>
                        <ul className="space-y-1">
                          {elig.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {elig.missing_info.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Information needed to confirm:</p>
                        <ul className="space-y-1">
                          {elig.missing_info.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Eligibility */}
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {grant.eligibility ? (
                  <ul className="space-y-2">
                    {grant.eligibility.split('\n').map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Eligibility information not available. Please check the official grant page.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={isSaved ? "default" : "outline"}
                  onClick={() => isSaved ? unsaveGrantMutation.mutate() : saveGrantMutation.mutate()}
                  disabled={saveGrantMutation.isPending || unsaveGrantMutation.isPending}
                >
                  {saveGrantMutation.isPending || unsaveGrantMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isSaved ? 'Removing...' : 'Saving...'}
                    </>
                  ) : isSaved ? (
                    <>
                      <BookmarkCheck className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Save Grant
                    </>
                  )}
                </Button>
                
                <a 
                  href={grant.url && !grant.url.includes('page-not-found') ? grant.url : "https://grants.gov/web/grants/search-grants.html"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block"
                >
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                     View Official Page
                  </Button>
                </a>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analyze Fit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Match Score */}
            {matchData && (
              <Card className="border-2 bg-muted">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-foreground" />
                    <CardTitle className="text-base">Match Score</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-foreground mb-1">
                      {matchData.match_score}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on your profile
                    </p>
                  </div>
                  {matchData.recommendation && (
                    <p className="text-sm">{matchData.recommendation}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Application Deadline</div>
                  <div className="text-muted-foreground">
                    {grant.deadline ? new Date(grant.deadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Rolling basis'}
                  </div>
                </div>
                {grant.posted_date && (
                  <div>
                    <div className="font-medium mb-1">Posted Date</div>
                    <div className="text-muted-foreground">
                      {new Date(grant.posted_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

