'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  MessageCircle,
  X,
  User,
  Search,
  Bookmark,
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
} from 'lucide-react';

/** Message definition for a single assistant message. */
interface AssistantMessage {
  id: string;
  text: string;
  action?: {
    label: string;
    href: string;
  };
  /** If true, this step is considered "done" based on profile state. */
  completed?: boolean;
}

interface OnboardingAssistantProps {
  displayName: string;
  /** Current onboarding step (persisted in profile). */
  currentStep: number;
  /** Profile completion percentage (0-100). */
  profileCompletion: number;
  /** Whether user has set up any profile fields yet. */
  hasProfileData: boolean;
  /** Advance the persisted step counter. */
  onAdvanceStep: (step: number) => void;
  /** Mark the entire onboarding as complete. */
  onComplete: () => void;
}

/** Total number of guided steps. */
const TOTAL_STEPS = 5;

/** Generates the list of assistant messages for the current state. */
function buildMessages(
  displayName: string,
  profileCompletion: number,
  hasProfileData: boolean,
): AssistantMessage[] {
  return [
    {
      id: 'welcome',
      text: `Hey ${displayName}! 👋 I'm your Nexar AI assistant. I'll walk you through everything you need to start discovering grants. Let's get you set up!`,
    },
    {
      id: 'profile',
      text: hasProfileData
        ? `Nice — I see you've started filling out your profile (${profileCompletion}% complete). The more details you add, the better I can match grants to your organization. Let's finish it up!`
        : `First things first — let's set up your profile. Tell me about your organization so I can find grants that actually match what you do.`,
      action: {
        label: hasProfileData ? 'Complete Profile' : 'Set Up Profile',
        href: '/profile',
      },
      completed: profileCompletion === 100,
    },
    {
      id: 'search',
      text: `Now let's explore! Our AI-powered search scans thousands of federal, state, and foundation grants in seconds. Try searching for something related to your work.`,
      action: {
        label: 'Try Grant Search',
        href: '/search',
      },
    },
    {
      id: 'save',
      text: `Found something promising? Hit the bookmark icon to save it. You can track all your saved grants and their deadlines in one place — no more spreadsheets!`,
      action: {
        label: 'View Saved Grants',
        href: '/saved',
      },
    },
    {
      id: 'recommendations',
      text: `One last thing — your dashboard shows AI-powered recommendations tailored to your profile. The more details you add, the smarter the matches get. You're all set! 🎉`,
      action: {
        label: 'View Dashboard',
        href: '/dashboard',
      },
    },
  ];
}

export function OnboardingAssistant({
  displayName,
  currentStep,
  profileCompletion,
  hasProfileData,
  onAdvanceStep,
  onComplete,
}: OnboardingAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(Math.min(currentStep + 1, TOTAL_STEPS));
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messages = buildMessages(displayName, profileCompletion, hasProfileData);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatEndRef.current?.scrollIntoView) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleCount, isTyping]);

  const showNextMessage = useCallback(() => {
    if (visibleCount >= TOTAL_STEPS) return;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const nextCount = visibleCount + 1;
      setVisibleCount(nextCount);
      onAdvanceStep(nextCount - 1);
    }, 1200);
  }, [visibleCount, onAdvanceStep]);

  const handleComplete = useCallback(() => {
    onComplete();
    setIsOpen(false);
  }, [onComplete]);

  const isLastStep = visibleCount >= TOTAL_STEPS;

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-3 shadow-lg hover:opacity-90 transition-all hover:scale-105 animate-fade-in"
          aria-label="Open onboarding assistant"
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Nexar Guide</span>
          {!isLastStep && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] animate-slide-up">
          <div className="rounded-2xl border-2 border-foreground/10 bg-background shadow-2xl overflow-hidden flex flex-col max-h-[min(520px,70vh)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-foreground text-background">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-background/20 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Nexar AI Guide</p>
                  <p className="text-xs opacity-70">Here to help you get started</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-background/20 transition-colors"
                aria-label="Minimize assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 border-b border-border/50 bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Getting started</span>
                <span className="text-xs font-medium">{Math.min(visibleCount, TOTAL_STEPS)}/{TOTAL_STEPS}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${(Math.min(visibleCount, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {messages.slice(0, visibleCount).map((msg, index) => (
                <div key={msg.id} className="animate-fade-in">
                  {/* Bot message bubble */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
                        {msg.text}
                      </div>
                      {/* Action button */}
                      {msg.action && (
                        <div className="mt-2 ml-1">
                          {msg.completed ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Done
                            </span>
                          ) : (
                            <Link href={msg.action.href}>
                              <Button size="sm" variant="outline" className="h-8 text-xs rounded-full">
                                {getStepIcon(msg.id)}
                                {msg.action.label}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-2.5 animate-fade-in">
                  <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: '0.15s' }} />
                      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Footer actions */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/50">
              {isLastStep ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleComplete}
                    className="flex-1 h-9 text-sm rounded-full"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Complete Setup
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={showNextMessage}
                    disabled={isTyping}
                    className="flex-1 h-9 text-sm rounded-full"
                  >
                    {isTyping ? 'Typing...' : visibleCount === 0 ? "Let's go!" : 'Next tip'}
                    {!isTyping && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComplete}
                    className="h-9 text-xs text-muted-foreground"
                  >
                    Skip
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getStepIcon(stepId: string) {
  switch (stepId) {
    case 'profile':
      return <User className="mr-1.5 h-3 w-3" />;
    case 'search':
      return <Search className="mr-1.5 h-3 w-3" />;
    case 'save':
      return <Bookmark className="mr-1.5 h-3 w-3" />;
    case 'recommendations':
      return <Sparkles className="mr-1.5 h-3 w-3" />;
    default:
      return null;
  }
}
