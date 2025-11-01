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
import { savedGrantsApi, authApi } from '@/lib/api';
import { 
  Bookmark, 
  Search, 
  Heart, 
  Archive, 
  Trash2, 
  Edit3, 
  Filter,
  Loader2,
  Star,
  Clock,
  DollarSign,
  Building,
  Tag,
  Plus
} from 'lucide-react';

export default function SavedGrantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, setAuth, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all');

  // Auto-login with demo user if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      authApi.login('demo@example.com', 'demo123')
        .then((response) => {
          const { access_token, user } = response.data;
          setAuth(user, access_token);
        })
        .catch(() => {
          // Silent fail for demo login
        });
    }
  }, [isAuthenticated, setAuth]);

  // Get saved grants
  const { data: savedGrantsData, isLoading } = useQuery({
    queryKey: ['saved-grants', filter],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const params: any = {};
      if (filter === 'favorites') params.favorites_only = true;
      if (filter === 'archived') params.include_archived = true;
      
      const response = await savedGrantsApi.list(token, params);
      return response.data;
    },
    enabled: isAuthenticated && !!token,
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['saved-grants-stats'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const response = await savedGrantsApi.stats(token);
      return response.data;
    },
    enabled: isAuthenticated && !!token,
  });

  // Search saved grants
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['saved-grants-search', searchQuery],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const response = await savedGrantsApi.search(searchQuery, token);
      return response.data;
    },
    enabled: isAuthenticated && searchQuery.length > 0 && !!token,
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

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: number) => {
      if (!token) throw new Error('Not authenticated');
      return savedGrantsApi.archive(id, token);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Grants</h1>
          <p className="text-muted-foreground">
            Manage your bookmarked grants and track your progress
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_saved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.favorites}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.archived}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.by_category || {}).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
            <Button
              variant={filter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('archived')}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Button>
          </div>
        </div>

        {/* Saved Grants List */}
        {isLoading || isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : savedGrants.length > 0 ? (
          <div className="space-y-4">
            {savedGrants.map((grant: any) => (
              <Card key={grant.id} className="hover:border-primary transition-colors">
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
                        {grant.is_archived && (
                          <Badge variant="outline">
                            <Archive className="mr-1 h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{grant.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {grant.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {grant.agency}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {grant.award_ceiling ? `Up to $${grant.award_ceiling.toLocaleString()}` : 'Amount varies'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {grant.close_date ? new Date(grant.close_date).toLocaleDateString() : 'Rolling'}
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

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Link href={`/grants/${grant.grant_id}`}>
                        <Button variant="outline" size="sm">
                          View Details
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
                        onClick={() => toggleFavoriteMutation.mutate(grant.id)}
                        disabled={toggleFavoriteMutation.isPending}
                      >
                        <Heart className={`h-4 w-4 ${grant.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveMutation.mutate(grant.id)}
                        disabled={archiveMutation.isPending}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(grant.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No grants found' : 'No saved grants yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
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
