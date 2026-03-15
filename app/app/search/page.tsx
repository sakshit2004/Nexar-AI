'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { useProfileStore } from '@/lib/profile-store';
import { grantsApi } from '@/lib/api';
import { 
  Search as SearchIcon, 
  Filter,
  DollarSign,
  Clock,
  Loader2,
  Sparkles,
  ArrowRight,
  Building
} from 'lucide-react';

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, authReady } = useAuthStore();
  const { profile } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    min_amount: '',
    max_amount: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Separate state for the actual search params (only updated on button click or auto-trigger)
  const [activeSearchParams, setActiveSearchParams] = useState({
    query: '',
    category: '',
    min_amount: '',
    max_amount: '',
  });

  // Redirect to login if not authenticated (only after auth state is resolved)
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, isAuthenticated, router]);

  // Pre-populate and auto-trigger search from URL ?q= param (homepage search)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && isAuthenticated) {
      setSearchQuery(q);
      setActiveSearchParams({ query: q, category: '', min_amount: '', max_amount: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated]);

  const { data: searchResults, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['grants', activeSearchParams],
    queryFn: async () => {
      const searchParams: any = {};
      if (activeSearchParams.query) {
        searchParams.q = activeSearchParams.query;
      }
      if (activeSearchParams.category) {
        searchParams.category = activeSearchParams.category;
      }
      if (activeSearchParams.min_amount) {
        searchParams.min_amount = parseInt(activeSearchParams.min_amount);
      }
      if (activeSearchParams.max_amount) {
        searchParams.max_amount = parseInt(activeSearchParams.max_amount);
      }
      const response = await grantsApi.search(searchParams);
      return response ?? { grants: [], providers_used: [], response_time_ms: 0 };
    },
    enabled: isAuthenticated && activeSearchParams.query !== '',
    refetchOnWindowFocus: false, // Don't refetch on window focus for search
  });

  const grants = searchResults?.grants || [];
  const providersUsed = searchResults?.providers_used || [];
  const responseTime = searchResults?.response_time_ms;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchParams({
      query: searchQuery,
      ...filters,
    });
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setActiveSearchParams({ query, category: '', min_amount: '', max_amount: '' });
  };


  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-stagger-in">
          <h1 className="text-3xl font-bold mb-2">Search Grants</h1>
          <p className="text-muted-foreground">
            Find grant opportunities matching your criteria
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by keywords, agency, or opportunity number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setActiveSearchParams({ query: searchQuery, ...filters });
                      }
                    }}
                    className="pl-10 h-11"
                  />
                </div>
                <Button type="submit" size="lg">
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              {/* Quick search chips — derived from the user's focus areas + keywords */}
              {activeSearchParams.query === '' && (() => {
                const focusAreas = profile?.focus_areas ?? [];
                const keywords = profile?.keywords ?? [];
                // Merge focus areas first, then keywords, deduplicate, cap at 8
                const seen = new Set<string>();
                const chips: string[] = [];
                for (const item of [...focusAreas, ...keywords]) {
                  const norm = item.trim();
                  if (norm && !seen.has(norm.toLowerCase())) {
                    seen.add(norm.toLowerCase());
                    chips.push(norm);
                    if (chips.length >= 8) break;
                  }
                }
                if (chips.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center mr-1">Quick:</span>
                    {chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleQuickSearch(chip)}
                        className="search-chip px-3 py-1.5 rounded-full border text-xs font-medium hover:bg-muted transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Filter toggle */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Filter className="h-3.5 w-3.5" />
                  {showFilters ? 'Hide filters' : 'Show filters'}
                </button>
                {(filters.category || filters.min_amount || filters.max_amount) && (
                  <button
                    type="button"
                    onClick={() => setFilters({ category: '', min_amount: '', max_amount: '' })}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      <option value="health">Health</option>
                      <option value="education">Education</option>
                      <option value="environment">Environment</option>
                      <option value="technology">Technology</option>
                      <option value="arts">Arts & Culture</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Amount</label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={filters.min_amount}
                      onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Amount</label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.max_amount}
                      onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="animate-stagger-in" style={{ animationDelay: '0.2s' }}>
          {isError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2 text-destructive">Search failed</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {error instanceof Error ? error.message : String(error)}
                </p>
                <Button className="mt-4" onClick={() => refetch()}>Try again</Button>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full border-2 border-muted" />
                  <Loader2 className="h-14 w-14 animate-spin text-foreground absolute inset-0" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Searching for Grants...</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Searching grant databases for best results
                </p>
              </CardContent>
            </Card>
          ) : activeSearchParams.query === '' ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <SearchIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery.trim() ? 'Run your search' : 'Start Your Grant Search'}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchQuery.trim()
                    ? 'Click Search or press Enter to find grants matching your query.'
                    : 'Enter keywords, select filters, and click Search to discover federal grant opportunities.'}
                </p>
              </CardContent>
            </Card>
          ) : grants && grants.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">
                    {grants.length} grant{grants.length !== 1 ? 's' : ''} found
                  </p>
                  {providersUsed.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        AI-powered
                        {responseTime && ` · ${(responseTime / 1000).toFixed(1)}s`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {grants.map((grant: any, index: number) => (
                <Card key={grant.id} className="interactive-card group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg group-hover:text-foreground transition-colors">{grant.title}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {grant.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{grant.category || 'General'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          {grant.award_amount || 'Amount varies'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {(() => { const d = new Date(grant.deadline); return grant.deadline && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Rolling'; })()}
                        </span>
                        {grant.agency && (
                          <span className="hidden sm:flex items-center gap-1.5">
                            <Building className="h-4 w-4" />
                            {grant.agency}
                          </span>
                        )}
                      </div>
                      <Link href={`/grants/${grant.id}`} onClick={() => { try { sessionStorage.setItem(`grant_${grant.id}`, JSON.stringify(grant)); } catch {} }}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-2">No grants found</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                The search completed but no federal grants matched &quot;{activeSearchParams.query}&quot;.{' '}
                {(() => {
                  const suggestions = ['Education', 'Health', 'Technology', 'Environment', 'federal grants'];
                  const current = activeSearchParams.query?.trim().toLowerCase();
                  const others = suggestions.filter(s => s.toLowerCase() !== current);
                  if (others.length === 0) {
                    return 'Try a different or broader search.';
                  }
                  const last = others.pop();
                  const text = others.length ? `${others.join(', ')}, or "${last}"` : `"${last}"`;
                  return `Try keywords like ${text} to see results.`;
                })()}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-20 flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>}>
      <SearchPageInner />
    </Suspense>
  );
}

