'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { grantsApi } from '@/lib/api';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: recommendedGrants, isLoading } = useQuery({
    queryKey: ['recommended-grants'],
    queryFn: async () => {
      const response = await grantsApi.getRecommended();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your grants today
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Subscription
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user?.subscription_tier || 'Free'}</div>
              <p className="text-xs text-muted-foreground">
                {user?.subscription_tier === 'free' ? '5 searches/week' : 'Unlimited searches'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Grants
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,147</div>
              <p className="text-xs text-muted-foreground">
                +180 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Award
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$250K</div>
              <p className="text-xs text-muted-foreground">
                Median federal grant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">37</div>
              <p className="text-xs text-muted-foreground">
                Due within 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Link href="/search">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Search className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Search Grants</CardTitle>
                <CardDescription>
                  Find federal grants matching your criteria
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Get AI Recommendations</CardTitle>
                <CardDescription>
                  Complete your profile for personalized matches
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
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>
                  AI-powered grant recommendations based on your profile
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
            {isLoading ? (
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
                <h4 className="font-semibold mb-2">No recommendations yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your profile to get personalized grant matches
                </p>
                <Link href="/profile">
                  <Button>Complete Profile</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

