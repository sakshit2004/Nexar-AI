'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { profileApi } from '@/lib/api';
import { 
  User,
  Building,
  Mail,
  Loader2,
  CheckCircle2,
  Sparkles,
  Save
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    organization_name: '',
    organization_type: '',
    focus_areas: '',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileApi.get();
      return response.data;
    },
    enabled: isAuthenticated,
    onSuccess: (data) => {
      setFormData({
        full_name: data.full_name || '',
        organization_name: data.organization_name || '',
        organization_type: data.organization_type || '',
        focus_areas: data.focus_areas?.join(', ') || '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return profileApi.update(data);
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      focus_areas: formData.focus_areas.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Complete your profile to get better AI recommendations
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your email and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subscription Tier</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <Badge className="capitalize">{user?.subscription_tier || 'free'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Tell us about your organization to get better grant matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="text-sm font-medium block mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="organization_name" className="text-sm font-medium block mb-2">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organization_name"
                        type="text"
                        placeholder="Acme Foundation"
                        value={formData.organization_name}
                        onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="organization_type" className="text-sm font-medium block mb-2">
                      Organization Type
                    </label>
                    <select
                      id="organization_type"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.organization_type}
                      onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                    >
                      <option value="">Select type...</option>
                      <option value="nonprofit">Nonprofit</option>
                      <option value="research">Research Institution</option>
                      <option value="government">Government Agency</option>
                      <option value="business">Small Business</option>
                      <option value="education">Educational Institution</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="focus_areas" className="text-sm font-medium block mb-2">
                      Focus Areas
                    </label>
                    <Input
                      id="focus_areas"
                      type="text"
                      placeholder="health, education, environment (comma-separated)"
                      value={formData.focus_areas}
                      onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your areas of focus separated by commas
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    {success && (
                      <span className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Profile updated successfully!
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {user?.subscription_tier === 'free' && (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle>Upgrade to Premium</CardTitle>
                  </div>
                  <CardDescription className="dark:text-indigo-200">
                    Get unlimited searches, priority support, and advanced AI features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Unlimited grant searches
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Advanced AI matching
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Priority email support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Custom alerts and tracking
                    </li>
                  </ul>
                  <Button className="w-full sm:w-auto">
                    Upgrade Now - $29/month
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

