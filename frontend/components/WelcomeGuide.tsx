'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  User,
  Search,
  Bookmark,
  Sparkles,
  ArrowRight,
  X,
  Zap,
  MousePointerClick,
} from 'lucide-react';

interface WelcomeGuideProps {
  displayName: string;
  onDismiss: () => void;
}

const GUIDE_STEPS = [
  {
    icon: User,
    title: 'Set up your profile',
    description: 'Add your organization details and focus areas so we can match you with the best grants.',
    href: '/profile',
    cta: 'Go to Profile',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: Search,
    title: 'Search for grants',
    description: 'Use AI-powered search to find federal, state, and foundation grants that match your needs.',
    href: '/search',
    cta: 'Start Searching',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: Bookmark,
    title: 'Save & track grants',
    description: "Bookmark grants you're interested in and track deadlines — all in one place.",
    href: '/saved',
    cta: 'View Saved',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    icon: Sparkles,
    title: 'Get AI recommendations',
    description: "Once your profile is complete, we'll show personalized grant matches right here on your dashboard.",
    href: '/profile',
    cta: 'Complete Profile',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
];

export function WelcomeGuide({ displayName, onDismiss }: WelcomeGuideProps) {
  return (
    <div className="mb-8 animate-stagger-in">
      <Card className="relative overflow-hidden border-2 border-foreground/10">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss welcome guide"
        >
          <X className="h-4 w-4" />
        </button>

        <CardContent className="pt-6 pb-6">
          {/* Welcome header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div className="pr-8">
              <h2 className="text-xl font-bold mb-1">
                Welcome to Nexar AI, {displayName}! 🎉
              </h2>
              <p className="text-sm text-muted-foreground">
                Here&apos;s how to get started — click any of the steps below to begin.
              </p>
            </div>
          </div>

          {/* Interactive guide steps */}
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDE_STEPS.map((step, index) => (
              <Link key={index} href={step.href} className="group block">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-secondary/50 transition-all group-hover:translate-y-[-2px] group-hover:shadow-md">
                  <div className={`h-10 w-10 rounded-lg ${step.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className={`h-5 w-5 ${step.color.split(' ').slice(1).join(' ')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-semibold text-sm">{step.title}</span>
                      <MousePointerClick className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {step.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                      {step.cta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Dismiss bar */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              You can always access these from the navigation bar above.
            </p>
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs">
              Got it, dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
