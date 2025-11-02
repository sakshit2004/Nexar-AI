'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { grantsApi } from '@/lib/api';
import { 
  Search as SearchIcon, 
  Filter,
  DollarSign,
  Clock,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    min_amount: '',
    max_amount: '',
  });
  
  // Separate state for the actual search params (only updated on button click)
  const [activeSearchParams, setActiveSearchParams] = useState({
    query: '',
    category: '',
    min_amount: '',
    max_amount: '',
  });

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
      
      const mockUser = {
        id: '1',
        email: 'admin@nexar.ai',
        name: 'Admin User',
        tier: 'premium' as const,
      };
      const mockToken = 'hardcoded-auth-token';
      setAuth(mockUser, mockToken);
    }
  }, [isAuthenticated, setAuth, router]);

  const { data: searchResults, isLoading, refetch } = useQuery({
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
      // Return full response with metadata
      return response.data;
    },
    enabled: isAuthenticated && activeSearchParams.query !== '',
    refetchOnWindowFocus: false, // Don't refetch on window focus for search
  });
  
  const grants = searchResults?.grants || [];
  const providersUsed = searchResults?.providers_used || [];
  const responseTime = searchResults?.response_time_ms;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update active search params only when button is clicked
    setActiveSearchParams({
      query: searchQuery,
      ...filters,
    });
  };


  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Grants</h1>
          <p className="text-muted-foreground">
            Find grant opportunities matching your criteria
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
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
                    className="pl-10"
                  />
                </div>
                <Button type="submit">
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-3">
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
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Searching for Grants...</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Searching grant databases for best results
                </p>
              </CardContent>
            </Card>
          ) : activeSearchParams.query === '' ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Your Grant Search</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Enter keywords, select filters, and click Search to discover federal grant opportunities.
                </p>
              </CardContent>
            </Card>
          ) : grants && grants.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    Found {grants.length} grants
                  </p>
                  {providersUsed.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Advanced search technology
                      </span>
                      {responseTime && (
                        <span className="text-xs text-muted-foreground">
                          ({(responseTime / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
              
              {grants.map((grant: any) => (
                <Card key={grant.id} className="hover:border-foreground transition-colors border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{grant.title}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {grant.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{grant.category || 'General'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {grant.award_amount || 'Amount varies'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Deadline: {grant.deadline ? new Date(grant.deadline).toLocaleDateString() : 'Rolling'}
                        </span>
                      </div>
                      <Link href={`/grants/${grant.id}`}>
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
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold mb-2">No grants found</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setFilters({ category: '', min_amount: '', max_amount: '' });
                refetch();
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

