'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { grantsApi, savedGrantsApi } from '@/lib/api';
import { 
  ArrowLeft,
  DollarSign,
  Clock,
  Building,
  FileText,
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
  const grantId = params.id as string;
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: grant, isLoading, error } = useQuery({
    queryKey: ['grant', grantId],
    queryFn: async () => {
      const response = await grantsApi.getById(grantId);
      console.log('Grant API response:', response.data);
      console.log('Grant URL:', response.data.url);
      return response.data;
    },
    enabled: isAuthenticated && !!grantId,
  });

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedGrantId, setSavedGrantId] = useState<number | null>(null);

  // Check if grant is saved
  const { data: savedStatus } = useQuery({
    queryKey: ['grant-saved-status', grantId],
    queryFn: async () => {
      const response = await savedGrantsApi.check(grantId);
      return response.data;
    },
    enabled: isAuthenticated && !!grantId,
  });

  // Update saved status when data changes
  useEffect(() => {
    if (savedStatus) {
      setIsSaved(savedStatus.is_saved);
    }
  }, [savedStatus]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      console.log('Analyzing grant:', grantId);
      const response = await grantsApi.analyze(grantId);
      console.log('Analysis response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      setAiSummary(data.ai_summary);
      setMatchData(data);
    },
    onError: (error) => {
      console.error('Analysis error:', error);
    },
  });

  // Save grant mutation
  const saveGrantMutation = useMutation({
    mutationFn: async () => {
      if (!grant) throw new Error('Grant data not available');
      
      // Map grant data to API format
      const saveData = {
        grant_id: grant.id || grantId,
        title: grant.title || 'Untitled Grant',
        agency: grant.agency,
        description: grant.description,
        award_amount: grant.award_amount || (grant.award_ceiling ? `$0 - $${grant.award_ceiling}` : undefined),
        deadline: grant.deadline || grant.close_date,
        category: grant.category,
        url: grant.url,
        opportunity_number: grant.opportunity_number || grant.cfda_number,
      };
      
      const response = await savedGrantsApi.save(saveData);
      return response.data;
    },
    onSuccess: (data) => {
      setIsSaved(true);
      setSavedGrantId(data.id);
    },
    onError: (error) => {
      console.error('Save grant error:', error);
    },
  });

  // Unsave grant mutation
  const unsaveGrantMutation = useMutation({
    mutationFn: async () => {
      if (!savedGrantId) {
        // If we don't have the saved grant ID, we need to find it
        const response = await savedGrantsApi.list();
        const savedGrant = response.data.saved_grants.find((sg: any) => sg.grant_id === grantId);
        if (savedGrant) {
          await savedGrantsApi.delete(savedGrant.id);
        }
      } else {
        await savedGrantsApi.delete(savedGrantId);
      }
    },
    onSuccess: () => {
      setIsSaved(false);
      setSavedGrantId(null);
    },
    onError: (error) => {
      console.error('Unsave grant error:', error);
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
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">{grant.category || 'General'}</Badge>
              <h1 className="text-3xl font-bold mb-2">{grant.title}</h1>
              <p className="text-muted-foreground">{grant.agency || 'Federal Agency'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{grant.award_amount || 'Amount varies'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Deadline: {grant.deadline ? new Date(grant.deadline).toLocaleDateString() : 'Rolling'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{grant.opportunity_number || grant.id || 'N/A'}</span>
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
                  href={grant.url || "https://grants.gov/search"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block"
                >
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                     View Official Page
                  </Button>
                </a>
                
                <Button className="w-full" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Summary
                </Button>
                
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

