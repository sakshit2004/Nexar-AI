'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { useProfileStore, type OrganizationProfile } from '@/lib/profile-store';
import { 
  User,
  Building,
  Mail,
  Loader2,
  CheckCircle2,
  Sparkles,
  Save,
  MapPin,
  Target,
  DollarSign,
  AlertTriangle,
  Trash2
} from 'lucide-react';

/** Calculates profile completion percentage based on filled form fields. */
function getProfileCompletion(formData: Record<string, string>): { percentage: number; filled: number; total: number } {
  const fields = ['full_name', 'organization_name', 'organization_type', 'focus_areas', 'location_state', 'keywords'];
  let filled = 0;
  for (const key of fields) {
    if (formData[key]?.trim()) filled++;
  }
  return { percentage: Math.round((filled / fields.length) * 100), filled, total: fields.length };
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, authReady, user } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    organization_name: '',
    organization_type: '',
    focus_areas: '',
    location_state: '',
    location_county: '',
    grant_amount_min: '',
    grant_amount_max: '',
    keywords: '',
  });
  const [success, setSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  // Redirect to login if not authenticated (only after auth state is resolved)
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, isAuthenticated, router]);

  const { profile, updateProfile } = useProfileStore();

  // Initialize form data from profile store
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        organization_name: profile.organization_name || '',
        organization_type: profile.organization_type || '',
        focus_areas: profile.focus_areas?.join(', ') || '',
        location_state: profile.location_state || '',
        location_county: profile.location_county || '',
        grant_amount_min: profile.grant_amount_min?.toString() || '',
        grant_amount_max: profile.grant_amount_max?.toString() || '',
        keywords: profile.keywords?.join(', ') || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const profileData: Partial<OrganizationProfile> = {
        full_name: data.full_name || '',
        organization_name: data.organization_name || '',
        organization_type: data.organization_type || '',
        focus_areas: data.focus_areas?.trim()
          ? data.focus_areas.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        location_state: data.location_state || '',
        location_county: data.location_county || '',
        grant_amount_min: data.grant_amount_min?.trim() ? parseInt(data.grant_amount_min, 10) : null,
        grant_amount_max: data.grant_amount_max?.trim() ? parseInt(data.grant_amount_max, 10) : null,
        keywords: data.keywords?.trim()
          ? data.keywords.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await updateProfile(profileData);
      return { data: profileData };
    },
    onSuccess: () => {
      setSuccess(true);
      // Invalidate all queries so recommendations/search refresh with new profile
      queryClient.invalidateQueries({ queryKey: ['recommended-grants'] });
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants-stats'] });
      queryClient.invalidateQueries({ queryKey: ['saved-grants'] });
      // Force refetch all queries
      queryClient.refetchQueries({ queryKey: ['recommended-grants'] });
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/auth/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account');
      return data;
    },
    onSuccess: async () => {
      setDeleteModalOpen(false);
      setDeleteEmailConfirm('');
      await signOut({ callbackUrl: '/' });
      router.push('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const completion = getProfileCompletion(formData);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-stagger-in">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Complete your profile to get better AI recommendations
          </p>
        </div>

        {/* Profile completion card */}
        <div className="mb-6 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {completion.percentage === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {completion.percentage === 100 
                      ? 'Profile complete! You\'re getting the best recommendations.' 
                      : `${completion.filled} of ${completion.total} fields completed`}
                  </span>
                </div>
                <span className="text-sm font-semibold">{completion.percentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            {/* Account Info */}
            <div className="animate-stagger-in" style={{ animationDelay: '0.15s' }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Account Information</CardTitle>
                  </div>
                  <CardDescription>
                    Your account email address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{user?.email}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="animate-stagger-in" style={{ animationDelay: '0.2s' }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Organization Profile</CardTitle>
                  </div>
                  <CardDescription>
                    Tell us about your organization to get better grant matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Personal Information
                      </div>
                      <div>
                        <label htmlFor="full_name" className="text-sm font-medium block mb-2">
                          Full Name
                        </label>
                        <Input
                          id="full_name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <hr className="border-border" />

                    {/* Organization Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Building className="h-4 w-4" />
                        Organization Details
                      </div>
                      <div>
                        <label htmlFor="organization_name" className="text-sm font-medium block mb-2">
                          Organization Name
                        </label>
                        <Input
                          id="organization_name"
                          type="text"
                          placeholder="Acme Foundation"
                          value={formData.organization_name}
                          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor="organization_type" className="text-sm font-medium block mb-2">
                          Organization Type
                        </label>
                        <select
                          id="organization_type"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
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
                    </div>

                    <hr className="border-border" />

                    {/* Focus & Keywords Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Target className="h-4 w-4" />
                        Focus Areas & Keywords
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
                        {formData.focus_areas && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {formData.focus_areas.split(',').map((area) => area.trim()).filter(Boolean).map((area) => (
                              <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="keywords" className="text-sm font-medium block mb-2">
                          Keywords
                        </label>
                        <Input
                          id="keywords"
                          type="text"
                          placeholder="research, innovation, community (comma-separated)"
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter keywords that describe your work or interests
                        </p>
                        {formData.keywords && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {formData.keywords.split(',').map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                              <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <hr className="border-border" />

                    {/* Location Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="location_state" className="text-sm font-medium block mb-2">
                            State
                          </label>
                          <Input
                            id="location_state"
                            type="text"
                            placeholder="California"
                            value={formData.location_state}
                            onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                          />
                        </div>
                        <div>
                          <label htmlFor="location_county" className="text-sm font-medium block mb-2">
                            County
                          </label>
                          <Input
                            id="location_county"
                            type="text"
                            placeholder="Los Angeles"
                            value={formData.location_county}
                            onChange={(e) => setFormData({ ...formData, location_county: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-border" />

                    {/* Grant Amount Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Grant Amount Preferences
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="grant_amount_min" className="text-sm font-medium block mb-2">
                            Min Grant Amount ($)
                          </label>
                          <Input
                            id="grant_amount_min"
                            type="number"
                            placeholder="10000"
                            value={formData.grant_amount_min}
                            onChange={(e) => setFormData({ ...formData, grant_amount_min: e.target.value })}
                          />
                        </div>
                        <div>
                          <label htmlFor="grant_amount_max" className="text-sm font-medium block mb-2">
                            Max Grant Amount ($)
                          </label>
                          <Input
                            id="grant_amount_max"
                            type="number"
                            placeholder="100000"
                            value={formData.grant_amount_max}
                            onChange={(e) => setFormData({ ...formData, grant_amount_max: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <Button type="submit" disabled={updateMutation.isPending} size="lg">
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
                        <span className="flex items-center gap-2 text-sm text-green-600 animate-fade-in">
                          <CheckCircle2 className="h-4 w-4" />
                          Profile updated successfully!
                        </span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Danger zone - Delete account */}
            <div className="animate-stagger-in" style={{ animationDelay: '0.25s' }}>
              <Card className="border-destructive/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-destructive leading-tight">Danger Zone</p>
                        <p className="text-xs text-muted-foreground leading-tight truncate">Permanently delete your account and all data. Cannot be undone.</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 shrink-0 text-xs h-7 px-3"
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" />
                      Delete account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>

      {/* Delete account confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md border-destructive/50 bg-background/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <CardTitle className="text-destructive">Delete account</CardTitle>
                <CardDescription>
                  This will permanently delete your account and all saved data. Enter your full email to confirm.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="delete-email" className="text-sm font-medium block mb-2">
                  Enter your email
                </label>
                <Input
                  id="delete-email"
                  type="email"
                  placeholder={user?.email ?? 'your@email.com'}
                  value={deleteEmailConfirm}
                  onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                  className="border-destructive/50 focus-visible:ring-destructive"
                  autoComplete="email"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeleteEmailConfirm('');
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={
                    deleteMutation.isPending ||
                    deleteEmailConfirm.toLowerCase().trim() !== (user?.email ?? '').toLowerCase().trim()
                  }
                  onClick={() => deleteMutation.mutate(deleteEmailConfirm)}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete my account'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

