'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { useProfileStore, type OrganizationProfile } from '@/lib/profile-store';
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
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
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

  // Auto-login with demo user if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const { login } = useAuthStore.getState();
      login('demo@example.com', 'demo123').catch(() => {});
    }
  }, [isAuthenticated]);

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
    mutationFn: async (data: any) => {
      try {
        console.log('Processing profile data:', data);
        // Update profile store directly
        // Convert strings to arrays and parse numbers
        const profileData: Partial<OrganizationProfile> = {
          full_name: data.full_name || '',
          organization_name: data.organization_name || '',
          organization_type: data.organization_type || '',
          focus_areas: typeof data.focus_areas === 'string' && data.focus_areas.trim()
            ? data.focus_areas.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(data.focus_areas) ? data.focus_areas : []),
          location_state: data.location_state || '',
          location_county: data.location_county || '',
          grant_amount_min: data.grant_amount_min && data.grant_amount_min.toString().trim()
            ? (typeof data.grant_amount_min === 'string' ? parseInt(data.grant_amount_min, 10) : data.grant_amount_min)
            : null,
          grant_amount_max: data.grant_amount_max && data.grant_amount_max.toString().trim()
            ? (typeof data.grant_amount_max === 'string' ? parseInt(data.grant_amount_max, 10) : data.grant_amount_max)
            : null,
          keywords: typeof data.keywords === 'string' && data.keywords.trim()
            ? data.keywords.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(data.keywords) ? data.keywords : []),
        };
        console.log('Processed profile data:', profileData);
        updateProfile(profileData);
        const savedProfile = useProfileStore.getState().profile;
        console.log('Profile saved to store:', savedProfile);
        return { data: profileData };
      } catch (error) {
        console.error('Error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Mutation successful, showing success message');
      setSuccess(true);
      // Invalidate queries so recommendations/search refresh with new profile
      queryClient.invalidateQueries({ queryKey: ['recommended-grants'] });
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Profile update error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    // Pass formData as-is (strings), mutationFn will handle conversion
    updateMutation.mutate(formData);
  };


  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Complete your profile to get better AI recommendations
          </p>
        </div>

        <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account information
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

          </div>
      </div>
    </div>
  );
}

