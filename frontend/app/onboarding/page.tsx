'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { useProfileStore } from '@/lib/profile-store';
import {
  ArrowRight,
  ArrowLeft,
  Building,
  MapPin,
  Target,
  DollarSign,
  Sparkles,
  Check,
  Search,
  Bookmark,
  BarChart3,
  Zap,
  User,
  Tag,
  Rocket,
} from 'lucide-react';

const TOTAL_STEPS = 7;

const ORGANIZATION_TYPES = [
  { value: 'nonprofit', label: 'Nonprofit', icon: '🏛️', description: 'Tax-exempt organizations' },
  { value: 'research', label: 'Research', icon: '🔬', description: 'Academic & research institutions' },
  { value: 'government', label: 'Government', icon: '🏢', description: 'State & local government' },
  { value: 'business', label: 'Small Business', icon: '💼', description: 'For-profit companies' },
  { value: 'education', label: 'Education', icon: '🎓', description: 'Schools & universities' },
];

const FOCUS_AREAS = [
  { value: 'health', label: 'Health & Wellness', icon: '❤️' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'environment', label: 'Environment', icon: '🌿' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'arts', label: 'Arts & Culture', icon: '🎨' },
  { value: 'housing', label: 'Housing', icon: '🏠' },
  { value: 'workforce', label: 'Workforce Development', icon: '👥' },
  { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { value: 'justice', label: 'Criminal Justice', icon: '⚖️' },
  { value: 'transportation', label: 'Transportation', icon: '🚌' },
  { value: 'community', label: 'Community Development', icon: '🤝' },
  { value: 'science', label: 'Science & Research', icon: '🧪' },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const APP_FEATURES = [
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Search thousands of grants with AI-powered filters that understand what you need.',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Get personalized grant matches based on your profile — updated in real time.',
  },
  {
    icon: Bookmark,
    title: 'Save & Track',
    description: 'Bookmark grants you\'re interested in and track deadlines in one place.',
  },
  {
    icon: BarChart3,
    title: 'Eligibility Analysis',
    description: 'Instantly see if you qualify for a grant with plain-English explanations.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { isAuthenticated, authReady, user } = useAuthStore();
  const { profile, updateProfile, fetchProfile, hydrated } = useProfileStore();

  const [step, setStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [locationState, setLocationState] = useState('');
  const [locationCounty, setLocationCounty] = useState('');
  const [grantAmountMin, setGrantAmountMin] = useState('');
  const [grantAmountMax, setGrantAmountMax] = useState('');
  const [keywords, setKeywords] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, isAuthenticated, router]);

  // Redirect if onboarding already completed
  useEffect(() => {
    if (hydrated && profile?.onboarding_completed) {
      router.push('/dashboard');
    }
  }, [hydrated, profile, router]);

  // Prefill from existing profile/user data
  useEffect(() => {
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
    if (profile) {
      if (profile.full_name && !fullName) setFullName(profile.full_name);
      if (profile.organization_name) setOrgName(profile.organization_name);
      if (profile.organization_type) setOrgType(profile.organization_type);
      if (profile.focus_areas?.length) setFocusAreas(profile.focus_areas);
      if (profile.location_state) setLocationState(profile.location_state);
      if (profile.location_county) setLocationCounty(profile.location_county);
      if (profile.grant_amount_min) setGrantAmountMin(String(profile.grant_amount_min));
      if (profile.grant_amount_max) setGrantAmountMax(String(profile.grant_amount_max));
      if (profile.keywords?.length) setKeywords(profile.keywords.join(', '));
    }
  }, [user, profile, fullName]);

  const goToStep = useCallback((newStep: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 200);
  }, []);

  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) goToStep(step + 1);
  }, [step, goToStep]);

  const prevStep = useCallback(() => {
    if (step > 1) goToStep(step - 1);
  }, [step, goToStep]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        organization_name: orgName,
        organization_type: orgType,
        focus_areas: focusAreas,
        location_state: locationState,
        location_county: locationCounty,
        grant_amount_min: grantAmountMin ? parseInt(grantAmountMin, 10) : null,
        grant_amount_max: grantAmountMax ? parseInt(grantAmountMax, 10) : null,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        onboarding_completed: true,
      });
      // Small delay for celebration animation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName || user?.name || '',
        onboarding_completed: true,
      });
      router.push('/dashboard');
    } catch {
      setSaving(false);
    }
  };

  // Calculate profile completion for the progress indicator
  const completedFields = [
    fullName,
    orgName,
    orgType,
    focusAreas.length > 0 ? 'yes' : '',
    locationState,
    keywords,
  ].filter(Boolean).length;
  const profilePercentage = Math.round((completedFields / 6) * 100);

  if (!authReady || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Progress bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Step {step} of {TOTAL_STEPS}
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i + 1 <= step
                        ? 'bg-foreground w-6'
                        : 'bg-muted w-4'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={saving}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 transition-all duration-200 ${
        isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center animate-stagger-in">
              <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                Welcome to Nexar AI{fullName ? `, ${fullName.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Let&apos;s set up your profile so we can find the best grants for you.
                This takes about 2 minutes.
              </p>

              <div className="w-full space-y-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium block">
                    What&apos;s your full name?
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={nextStep}
                className="mt-8 h-12 px-8 text-base"
                disabled={!fullName.trim()}
              >
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Organization Details */}
          {step === 2 && (
            <div className="animate-stagger-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Building className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Tell us about your organization</h2>
              </div>
              <p className="text-muted-foreground mb-8 ml-[52px]">
                This helps us match you with relevant grants.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="orgName" className="text-sm font-medium block">
                    Organization name
                  </label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="e.g. Green Future Foundation"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium block">Organization type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ORGANIZATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setOrgType(type.value)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          orgType === type.value
                            ? 'border-foreground bg-secondary'
                            : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{type.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                        {orgType === type.value && (
                          <Check className="h-4 w-4 ml-auto flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="h-11 px-6">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Focus Areas */}
          {step === 3 && (
            <div className="animate-stagger-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">What areas do you focus on?</h2>
              </div>
              <p className="text-muted-foreground mb-8 ml-[52px]">
                Select all that apply — we&apos;ll use these to find matching grants.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() => toggleFocusArea(area.value)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${
                      focusAreas.includes(area.value)
                        ? 'border-foreground bg-secondary'
                        : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                    }`}
                  >
                    <span className="text-xl">{area.icon}</span>
                    <span className="text-sm font-medium text-left">{area.label}</span>
                    {focusAreas.includes(area.value) && (
                      <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {focusAreas.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {focusAreas.length} area{focusAreas.length > 1 ? 's' : ''} selected
                </p>
              )}

              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="h-11 px-6">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="animate-stagger-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Where are you located?</h2>
              </div>
              <p className="text-muted-foreground mb-8 ml-[52px]">
                Many grants are region-specific. This helps us narrow your results.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="state" className="text-sm font-medium block">
                    State
                  </label>
                  <select
                    id="state"
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    className="w-full h-12 rounded-lg border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="county" className="text-sm font-medium block">
                    County <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    id="county"
                    type="text"
                    placeholder="e.g. Los Angeles County"
                    value={locationCounty}
                    onChange={(e) => setLocationCounty(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="h-11 px-6">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Grant Preferences */}
          {step === 5 && (
            <div className="animate-stagger-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Grant preferences</h2>
              </div>
              <p className="text-muted-foreground mb-8 ml-[52px]">
                Help us understand the size of grants you&apos;re looking for.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="grantMin" className="text-sm font-medium block">
                      Minimum amount ($)
                    </label>
                    <Input
                      id="grantMin"
                      type="number"
                      placeholder="e.g. 10000"
                      value={grantAmountMin}
                      onChange={(e) => setGrantAmountMin(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="grantMax" className="text-sm font-medium block">
                      Maximum amount ($)
                    </label>
                    <Input
                      id="grantMax"
                      type="number"
                      placeholder="e.g. 500000"
                      value={grantAmountMax}
                      onChange={(e) => setGrantAmountMax(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="keywords" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Keywords
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    id="keywords"
                    type="text"
                    placeholder="e.g. climate change, renewable energy, STEM"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate keywords with commas. These help fine-tune your grant matches.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="h-11 px-6">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: App Tour */}
          {step === 6 && (
            <div className="animate-stagger-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Rocket className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Here&apos;s what you can do</h2>
              </div>
              <p className="text-muted-foreground mb-8 ml-[52px]">
                A quick look at how Nexar AI helps you discover and win grants.
              </p>

              <div className="grid gap-4">
                {APP_FEATURES.map((feature, i) => (
                  <Card key={i} className="interactive-card">
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="h-11 px-6">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Review & Complete */}
          {step === 7 && (
            <div className="animate-stagger-in">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  You&apos;re all set!
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Here&apos;s a summary of your profile. You can always update it later.
                </p>
              </div>

              {/* Profile summary */}
              <Card className="mb-6">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profile completion</span>
                    <span className="text-sm font-semibold">{profilePercentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-700 ease-out animate-progress-fill"
                      style={{ width: `${profilePercentage}%` }}
                    />
                  </div>

                  <div className="grid gap-3">
                    {fullName && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{fullName}</span>
                      </div>
                    )}
                    {orgName && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Organization:</span>
                        <span className="font-medium">{orgName}</span>
                      </div>
                    )}
                    {orgType && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{orgType}</span>
                      </div>
                    )}
                    {focusAreas.length > 0 && (
                      <div className="flex items-start gap-3 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Focus:</span>
                        <span className="font-medium">
                          {focusAreas.map(a => {
                            const area = FOCUS_AREAS.find(f => f.value === a);
                            return area ? area.label : a;
                          }).join(', ')}
                        </span>
                      </div>
                    )}
                    {locationState && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {locationCounty ? `${locationCounty}, ${locationState}` : locationState}
                        </span>
                      </div>
                    )}
                    {keywords && (
                      <div className="flex items-start gap-3 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Keywords:</span>
                        <span className="font-medium">{keywords}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={handleComplete}
                  className="h-12 px-8 text-base w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                      Setting things up...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <Rocket className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={prevStep} disabled={saving}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to edit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
