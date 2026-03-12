'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { savedGrantsApi } from '@/lib/api';
import { 
  Bookmark, 
  Search, 
  Heart, 
  Trash2, 
  Loader2,
  Star,
  Clock,
  DollarSign,
  Building,
  Tag,
  Plus,
  ArrowRight
} from 'lucide-react';

export default function SavedGrantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, authReady, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [heartRedById, setHeartRedById] = useState<Record<number, boolean>>({});

  // Redirect to login if not authenticated (only after auth state is resolved)
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, isAuthenticated, router]);

  // Get saved grants
  const { data: savedGrantsData, isLoading } = useQuery({
    queryKey: ['saved-grants', filter],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const params: any = {};
      if (filter === 'favorites') params.favorites_only = true;
      
      const response = await savedGrantsApi.list(token, params);
      return response ?? { saved_grants: [], total_count: 0, favorites_count: 0 };
    },
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['saved-grants-stats'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const response = await savedGrantsApi.stats(token);
      return response ?? { total_saved: 0, favorites: 0, by_category: {}, by_agency: {}, recent_saves: [] };
    },
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  // Search saved grants
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['saved-grants-search', searchQuery],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const response = await savedGrantsApi.search(searchQuery, token);
      return response ?? { saved_grants: [] };
    },
    enabled: isAuthenticated && searchQuery.length > 0 && !!token,
    retry: false,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!token) throw new Error('Not authenticated');
      return savedGrantsApi.toggleFavorite(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-grants'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants-stats'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!token) throw new Error('Not authenticated');
      return savedGrantsApi.delete(String(id), token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-grants'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants-stats'] });
    },
  });


  const savedGrants = searchQuery ? searchResults?.saved_grants || [] : savedGrantsData?.saved_grants || [];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-stagger-in">
          <h1 className="text-3xl font-bold mb-2">Saved Grants</h1>
          <p className="text-muted-foreground">
            Manage your bookmarked grants and track your progress
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="animate-stagger-in" style={{ animationDelay: '0.1s' }}>
              <Card className="interactive-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold stat-number">{stats.total_saved}</div>
                  <p className="text-xs text-muted-foreground mt-1">Grants bookmarked</p>
                </CardContent>
              </Card>
            </div>

            <div className="animate-stagger-in" style={{ animationDelay: '0.15s' }}>
              <Card className="interactive-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold stat-number">{stats.favorites}</div>
                  <p className="text-xs text-muted-foreground mt-1">Top picks</p>
                </CardContent>
              </Card>
            </div>

            <div className="animate-stagger-in" style={{ animationDelay: '0.2s' }}>
              <Card className="interactive-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold stat-number">
                    {Object.keys(stats.by_category || {}).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Unique categories</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-stagger-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved grants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('favorites')}
            >
              <Heart className="mr-2 h-4 w-4" />
              Favorites
            </Button>
          </div>
        </div>

        {/* Saved Grants List */}
        {isLoading || isSearching ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-muted" />
              <Loader2 className="h-12 w-12 animate-spin text-foreground absolute inset-0" />
            </div>
            <p className="text-sm text-muted-foreground">Loading your saved grants...</p>
          </div>
        ) : savedGrants.length > 0 ? (
          <div className="space-y-4">
            {savedGrants.map((grant: any, index: number) => (
              <div key={grant.id} className="animate-stagger-in" style={{ animationDelay: `${0.05 * index}s` }}>
                <Card className="interactive-card group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{grant.category || 'General'}</Badge>
                          {grant.is_favorite && (
                            <Badge variant="default" className="bg-yellow-500">
                              <Star className="mr-1 h-3 w-3" />
                              Favorite
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors">{grant.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {grant.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1.5">
                            <Building className="h-4 w-4" />
                            {grant.agency || 'Federal Agency'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4" />
                            {grant.award_amount || (grant.award_ceiling ? `Up to $${Number(grant.award_ceiling).toLocaleString()}` : 'Amount varies')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {(grant.deadline || grant.close_date) ? new Date(grant.deadline || grant.close_date).toLocaleDateString() : 'Rolling'}
                          </span>
                        </div>

                        {grant.user_notes && (
                          <div className="bg-muted p-3 rounded-md mb-3">
                            <p className="text-sm">
                              <strong>Your notes:</strong> {grant.user_notes}
                            </p>
                          </div>
                        )}

                        {grant.user_tags && grant.user_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {grant.user_tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex gap-2">
                        <Link
                          href={`/grants/${grant.grant_id}`}
                          onClick={() => {
                            try {
                              const g = { id: grant.grant_id, title: grant.title, agency: grant.agency, description: grant.description, eligibility: grant.eligibility, award_amount: grant.award_amount, deadline: grant.deadline, category: grant.category, url: grant.url, opportunity_number: grant.opportunity_number };
                              sessionStorage.setItem(`grant_${grant.grant_id}`, JSON.stringify(g));
                            } catch {}
                          }}
                        >
                          <Button variant="outline" size="sm">
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        {grant.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={grant.url} target="_blank" rel="noopener noreferrer">
                              Official Page
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const showRed = heartRedById[grant.id] ?? grant.is_favorite;
                            setHeartRedById((prev) => ({ ...prev, [grant.id]: !showRed }));
                            toggleFavoriteMutation.mutate(grant.id);
                          }}
                          disabled={toggleFavoriteMutation.isPending}
                          className="hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              heartRedById[grant.id] ?? grant.is_favorite
                                ? 'fill-red-500 text-red-500'
                                : ''
                            }`}
                          />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(grant.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No grants found' : 'No saved grants yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start saving grants you\'re interested in to keep track of them'
              }
            </p>
            {!searchQuery && (
              <Link href="/search">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Browse Grants
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
