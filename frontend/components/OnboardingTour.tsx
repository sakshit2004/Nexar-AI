'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X, MousePointer } from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'nexar_onboarding_complete';
const ONBOARDING_TRIGGER_KEY = 'nexar_show_onboarding';

export function getShouldShowOnboarding(searchParams?: URLSearchParams | null): boolean {
  if (typeof window === 'undefined') return false;
  const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (completed) return false;
  // URL param ?onboarding=1 - check both searchParams and window.location (in case of timing)
  if (searchParams?.get('onboarding') === '1') return true;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === '1') return true;
  } catch {
    // ignore
  }
  // Fallback: sessionStorage (set by register flow before redirect)
  return !!sessionStorage.getItem(ONBOARDING_TRIGGER_KEY);
}

export function setOnboardingTrigger(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ONBOARDING_TRIGGER_KEY, '1');
  }
}

export function completeOnboarding(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
    sessionStorage.removeItem(ONBOARDING_TRIGGER_KEY);
  }
}

interface TourStep {
  id: string;
  target?: string; // data-tour selector
  targetFallback?: string; // used when target not found (e.g. mobile)
  title: string;
  message: string;
  actionHint?: string; // e.g. "Click Search to try it"
  waitForClick?: boolean; // if true, advance when user clicks the target
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexar AI!',
    message: "I'm your guide. Let me show you around the dashboard so you can start finding grants that match your organization.",
  },
  {
    id: 'recommended',
    target: '[data-tour="onboarding-recommended"]',
    title: 'Recommended for You',
    message: "This section shows AI-powered grant recommendations tailored to your profile. Complete your profile to get better matches.",
  },
  {
    id: 'search',
    target: '[data-tour="onboarding-search"]', // Nav link (desktop); fallback to card if not found
    targetFallback: '[data-tour="onboarding-search-card"]',
    title: 'Search Grants',
    message: "Use Search to find federal grants by keyword, category, or amount. Our AI discovers real opportunities and gives you plain-English summaries.",
    actionHint: 'Click Search to try it, or Next to continue',
    waitForClick: true,
  },
  {
    id: 'saved',
    target: '[data-tour="onboarding-saved"]',
    targetFallback: '[data-tour="onboarding-saved-card"]',
    title: 'Saved Grants',
    message: "Bookmark grants you're interested in here. You can track deadlines and come back to them anytime.",
  },
  {
    id: 'profile',
    target: '[data-tour="onboarding-profile"]',
    targetFallback: '[data-tour="onboarding-profile-card"]',
    title: 'Your Profile',
    message: "Set up your organization details, focus areas, and keywords. This unlocks personalized recommendations.",
    actionHint: "Let's set up your profile now",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateTargetPosition = useCallback(() => {
    const currentStep = STEPS[step];
    if (!currentStep || typeof document === 'undefined') {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }
    const s = currentStep.target || (currentStep as TourStep & { targetFallback?: string }).targetFallback;
    if (!s) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }
    const fallback = (currentStep as TourStep & { targetFallback?: string }).targetFallback;
    const el = (currentStep.target ? document.querySelector(currentStep.target) : null) || (fallback ? document.querySelector(fallback) : null);
    if (!el) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    const padding = 16;
    const tooltipWidth = 384; // max-w-sm
    const tooltipHeight = 280;
    // Prefer below; if not enough space, put above
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const putBelow = spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove;
    setTooltipPosition({
      top: putBelow ? rect.bottom + padding : rect.top - tooltipHeight - padding,
      left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
    });
  }, [step]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const shouldShow = getShouldShowOnboarding(searchParams);
    setVisible(shouldShow);
  }, [mounted, searchParams]);

  useEffect(() => {
    if (!visible) return;
    updateTargetPosition();
    const handleResize = () => updateTargetPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [visible, step, updateTargetPosition]);

  // Poll for target (element might not exist yet)
  useEffect(() => {
    const currentStep = STEPS[step];
    const hasSelector = currentStep?.target || (currentStep as TourStep & { targetFallback?: string })?.targetFallback;
    if (!visible || !hasSelector) return;
    const check = () => {
      const fallback = (currentStep as TourStep & { targetFallback?: string }).targetFallback;
      const el = (currentStep.target ? document.querySelector(currentStep.target) : null) || (fallback ? document.querySelector(fallback) : null);
      if (el) {
        updateTargetPosition();
      }
    };
    check();
    const id = setInterval(check, 300);
    return () => clearInterval(id);
  }, [visible, step, updateTargetPosition]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleGoToProfile();
    }
  };

  const handleGoToProfile = useCallback(() => {
    completeOnboarding();
    setVisible(false);
    onComplete?.();
    router.push('/profile');
  }, [onComplete, router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    setVisible(false);
    onComplete?.();
    router.replace('/dashboard', { scroll: false });
  }, [onComplete, router]);

  // Listen for clicks on target when waitForClick
  useEffect(() => {
    const currentStep = STEPS[step];
    if (!visible || !currentStep?.waitForClick) return;
    const fallback = (currentStep as TourStep & { targetFallback?: string }).targetFallback;
    const el = (currentStep.target ? document.querySelector(currentStep.target) : null) || (fallback ? document.querySelector(fallback) : null);
    if (!el) return;
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        handleGoToProfile();
      }
    };
    el.addEventListener('click', handleClick, true);
    return () => el.removeEventListener('click', handleClick, true);
  }, [visible, step, handleGoToProfile]);

  if (!visible) return null;

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const hasTarget = !!(currentStep?.target || (currentStep as TourStep & { targetFallback?: string })?.targetFallback) && !!targetRect;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Spotlight overlay - 4 rects to create cutout */}
      {hasTarget && targetRect && (
        <>
          {/* Top */}
          <div
            className="absolute left-0 right-0 bg-black/60 transition-all duration-300"
            style={{ top: 0, height: Math.max(0, targetRect.top - 8) }}
          />
          {/* Left */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: 0,
              width: Math.max(0, targetRect.left - 8),
              height: targetRect.height + 16,
            }}
          />
          {/* Right */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 8,
              right: 0,
              width: `calc(100vw - ${targetRect.right + 8}px)`,
              height: targetRect.height + 16,
            }}
          />
          {/* Bottom */}
          <div
            className="absolute left-0 right-0 bg-black/60 transition-all duration-300"
            style={{
              top: targetRect.bottom + 8,
              height: `calc(100vh - ${targetRect.bottom + 8}px)`,
            }}
          />
          {/* Highlight ring around target */}
          <div
            className="absolute rounded-lg border-2 border-foreground/90 shadow-[0_0_0_4px_rgba(0,0,0,0.3)] pointer-events-none animate-pulse-border"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </>
      )}

      {/* Full overlay when no target (welcome step) */}
      {!hasTarget && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-[101] w-full max-w-sm animate-slide-up"
        style={
          hasTarget && tooltipPosition
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: 'min(384px, calc(100vw - 32px))',
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(384px, calc(100vw - 32px))',
              }
        }
      >
        <div className="bg-background border-2 rounded-xl shadow-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Nexar Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="rounded-full shrink-0"
              aria-label="Skip tour"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <h4 className="font-medium mb-1">{currentStep.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {currentStep.message}
          </p>
          {currentStep.actionHint && (
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <MousePointer className="h-3.5 w-3.5" />
              {currentStep.actionHint}
            </p>
          )}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-foreground' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleSkip}>
              Skip tour
            </Button>
            <Button className="flex-1" onClick={handleNext}>
              {isLastStep ? (
                <>
                  Go to Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
