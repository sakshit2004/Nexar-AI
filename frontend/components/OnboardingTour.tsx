'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  MousePointer,
  Search,
  Bookmark,
  User,
  CheckCircle2,
  Rocket,
} from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'nexar_onboarding_complete';
const ONBOARDING_TRIGGER_KEY = 'nexar_show_onboarding';

// ============ DETECTION & CONTROL FUNCTIONS ============

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

// ============ TOUR STEPS ============

interface TourStep {
  id: string;
  target?: string;
  targetFallback?: string;
  title: string;
  message: string;
  emoji: string;
  actionHint?: string;
  waitForClick?: boolean;
  icon: typeof Sparkles;
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexar AI! 🎉',
    message:
      "Hi! I'm your Nexar AI guide. In just a minute I'll show you everything on this dashboard — from your personalized grant feed to search, bookmarks, and profile setup. Let's go!",
    emoji: '👋',
    icon: Rocket,
  },
  {
    id: 'recommended',
    target: '[data-tour="onboarding-recommended"]',
    title: 'Recommended for You ✨',
    message:
      'This is your personalized grant feed. Our AI scans thousands of federal opportunities and surfaces the ones that best match your organization. The more complete your profile, the smarter these picks become!',
    emoji: '✨',
    icon: Sparkles,
  },
  {
    id: 'search',
    target: '[data-tour="onboarding-search"]',
    targetFallback: '[data-tour="onboarding-search-card"]',
    title: 'Search Any Grant 🔍',
    message:
      'Need something specific? Search thousands of federal grants by keyword, category, or funding amount. Our AI reads the fine print and gives you plain-English summaries so you can decide in seconds.',
    emoji: '🔍',
    actionHint: 'Click Search in the nav to explore, or press Next to continue',
    waitForClick: true,
    icon: Search,
  },
  {
    id: 'saved',
    target: '[data-tour="onboarding-saved"]',
    targetFallback: '[data-tour="onboarding-saved-card"]',
    title: 'Save & Track Grants 📌',
    message:
      'Spotted something promising? Tap the bookmark icon on any grant to save it here. Track deadlines and keep your shortlist organized — no spreadsheets needed!',
    emoji: '📌',
    actionHint: 'Click Saved in the nav to view your bookmarks, or press Next',
    waitForClick: true,
    icon: Bookmark,
  },
  {
    id: 'profile',
    target: '[data-tour="onboarding-profile"]',
    targetFallback: '[data-tour="onboarding-profile-card"]',
    title: 'Set Up Your Profile 🏢',
    message:
      "Last step — tell us about your organization: its name, type, focus areas, location, and keywords. This is how we personalize your entire experience. It takes under a minute and unlocks AI-matched recommendations just for you.",
    emoji: '🏢',
    actionHint: 'Click Profile to set it up now, or press Finish to do it later',
    waitForClick: true,
    icon: User,
  },
  {
    id: 'complete',
    title: "You're All Set! 🚀",
    message:
      "Tour complete! Head to your profile to unlock personalized grant recommendations, or start exploring the dashboard right now. Your next big funding opportunity is waiting.",
    emoji: '🎯',
    icon: CheckCircle2,
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  /** When true, show the tour immediately regardless of localStorage (e.g. for new users). */
  forceShow?: boolean;
}

export function OnboardingTour({ onComplete, forceShow }: OnboardingTourProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Once the user dismisses the tour, prevent the forceShow prop from re-opening it
  // before the async onComplete() (profile update) finishes writing to the store.
  const dismissed = useRef(false);

  const findTargetElement = useCallback((tourStep: TourStep): Element | null => {
    if (typeof document === 'undefined') return null;
    const primary = tourStep.target ? document.querySelector(tourStep.target) : null;
    if (primary) return primary;
    return tourStep.targetFallback ? document.querySelector(tourStep.targetFallback) : null;
  }, []);

  const updateTargetPosition = useCallback(() => {
    const currentStep = STEPS[step];
    if (!currentStep) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }
    const el = findTargetElement(currentStep);
    if (!el) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    const padding = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const putBelow = spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove;
    setTooltipPosition({
      top: putBelow ? rect.bottom + padding : rect.top - tooltipHeight - padding,
      left: Math.max(
        padding,
        Math.min(
          rect.left + rect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - padding,
        ),
      ),
    });
  }, [step, findTargetElement]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || dismissed.current) return;
    // If parent explicitly forces visibility (new user, not yet onboarded), show immediately.
    if (forceShow) {
      setVisible(true);
      return;
    }
    const shouldShow = getShouldShowOnboarding(searchParams);
    setVisible(shouldShow);
  }, [mounted, searchParams, forceShow]);

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

  // Poll for target element (it might not exist yet)
  useEffect(() => {
    const currentStep = STEPS[step];
    if (!visible || (!currentStep?.target && !currentStep?.targetFallback)) return;
    const check = () => {
      if (findTargetElement(currentStep)) updateTargetPosition();
    };
    check();
    const id = setInterval(check, 300);
    return () => clearInterval(id);
  }, [visible, step, updateTargetPosition, findTargetElement]);

  const transitionToStep = useCallback(
    (nextStep: number) => {
      if (transitioning) return;
      setTransitioning(true);
      // Brief fade-out before switching
      setTimeout(() => {
        setStep(nextStep);
        setTransitioning(false);
      }, 150);
    },
    [transitioning],
  );

  const handleGoToProfile = useCallback(() => {
    dismissed.current = true;
    completeOnboarding();
    setVisible(false);
    onComplete?.();
    router.push('/profile');
  }, [onComplete, router]);

  // Closing the tour (X button, Esc, or Skip) marks it as done so it never shows again.
  const handleClose = useCallback(() => {
    dismissed.current = true;
    completeOnboarding();
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = handleClose;

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      transitionToStep(step + 1);
    } else {
      handleGoToProfile();
    }
  }, [step, transitionToStep, handleGoToProfile]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      transitionToStep(step - 1);
    }
  }, [step, transitionToStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose, handleNext, handleBack]);

  // Listen for clicks on target when waitForClick
  useEffect(() => {
    const currentStep = STEPS[step];
    if (!visible || !currentStep?.waitForClick) return;
    const el = findTargetElement(currentStep);
    if (!el) return;
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      handleNext();
    };
    el.addEventListener('click', handleClick, true);
    return () => el.removeEventListener('click', handleClick, true);
  }, [visible, step, findTargetElement, handleNext]);

  if (!visible) return null;

  const currentStep = STEPS[step];
  const isCompleteStep = currentStep.id === 'complete';
  const isWelcomeStep = currentStep.id === 'welcome';
  const hasTarget =
    !!(currentStep?.target || currentStep?.targetFallback) && !!targetRect;
  const StepIcon = currentStep.icon;
  // Content steps (excluding welcome and complete)
  const contentSteps = STEPS.filter((s) => s.id !== 'complete');

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in"
      role="dialog"
      aria-label="Onboarding tour"
      aria-modal="true"
    >
      {/* Spotlight overlay — four rects forming a cutout around the target */}
      {hasTarget && targetRect && (
        <>
          <div
            className="absolute left-0 right-0 bg-black/50 transition-all duration-500 ease-out"
            style={{ top: 0, height: Math.max(0, targetRect.top - 8) }}
          />
          <div
            className="absolute bg-black/50 transition-all duration-500 ease-out"
            style={{
              top: targetRect.top - 8,
              left: 0,
              width: Math.max(0, targetRect.left - 8),
              height: targetRect.height + 16,
            }}
          />
          <div
            className="absolute bg-black/50 transition-all duration-500 ease-out"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 8,
              right: 0,
              width: `calc(100vw - ${targetRect.right + 8}px)`,
              height: targetRect.height + 16,
            }}
          />
          <div
            className="absolute left-0 right-0 bg-black/50 transition-all duration-500 ease-out"
            style={{
              top: targetRect.bottom + 8,
              height: `calc(100vh - ${targetRect.bottom + 8}px)`,
            }}
          />
          {/* White border ring around the active target */}
          <div
            className="absolute pointer-events-none rounded-xl transition-all duration-500 ease-out"
            style={{
              top: targetRect.top - 10,
              left: targetRect.left - 10,
              width: targetRect.width + 20,
              height: targetRect.height + 20,
              border: '2px solid white',
              boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.15)',
            }}
          />
        </>
      )}

      {/* Full overlay for centered steps (welcome + complete) */}
      {!hasTarget && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={`absolute z-[101] w-full max-w-[400px] transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        } ${hasTarget ? '' : 'animate-slide-up'}`}
        style={
          hasTarget && tooltipPosition
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: 'min(400px, calc(100vw - 32px))',
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(400px, calc(100vw - 32px))',
              }
        }
      >
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Colored header strip */}
          <div className="relative px-6 pt-5 pb-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-3 right-3 rounded-full shrink-0 h-8 w-8 hover:bg-muted"
              aria-label="Close tour (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Step icon + emoji */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isCompleteStep
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : isWelcomeStep
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                }`}
              >
                {isCompleteStep ? (
                  <CheckCircle2 className="h-6 w-6 animate-tour-check-pop" />
                ) : (
                  <StepIcon className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-tight">
                  {currentStep.title}
                </h3>
                {!isCompleteStep && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {step + 1} of {contentSteps.length}
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStep.message}
            </p>

            {/* Action hint */}
            {currentStep.actionHint && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <MousePointer className="h-3.5 w-3.5 shrink-0" />
                {currentStep.actionHint}
              </p>
            )}
          </div>

          {/* Footer with progress + buttons */}
          <div className="px-6 pb-5 pt-2">
            {/* Progress dots */}
            <div className="flex gap-1.5 mb-4" role="progressbar" aria-valuenow={Math.round(((step + 1) / STEPS.length) * 100)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`Step ${step + 1} of ${STEPS.length}`}>
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'bg-foreground flex-[2]'
                      : i < step
                        ? 'bg-foreground/40 flex-1'
                        : 'bg-muted flex-1'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {isCompleteStep ? (
                <Button
                  className="w-full"
                  onClick={handleGoToProfile}
                >
                  Set Up Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  {step > 0 ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleBack}
                      aria-label="Previous step"
                      className="shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSkip}
                    >
                      Skip tour
                    </Button>
                  )}
                  <Button className="flex-1" onClick={handleNext}>
                    {step === contentSteps.length - 1 ? (
                      <>
                        Finish Tour
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    ) : isWelcomeStep ? (
                      <>
                        {"Let's Go!"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Keyboard hint (desktop only) */}
            <p className="hidden sm:block text-[11px] text-muted-foreground/60 text-center mt-3" aria-hidden="true">
              Use left/right arrow keys to navigate · Esc to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
