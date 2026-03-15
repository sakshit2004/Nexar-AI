'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LandingFooter } from '../components/LandingFooter';
import { 
  ArrowRight,
  Check,
  ChevronRight,
  Github,
  GitBranch,
} from 'lucide-react';
import { GrantVisualization } from '../components/landing/GrantVisualization';

// Animated typewriter for cycling grant source types
function TypewriterCycle({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[index];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, words]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}


export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero + Demo — combined */}
      <section className="relative px-4 overflow-hidden">

        {/* Background: fine dot grid */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-float" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] -z-10 animate-float" style={{ animationDelay: '3s', animationDuration: '12s' }} />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center py-24 lg:py-32">

          {/* Left: headline + checklist + CTAs */}
          <div className="relative z-10">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="outline" className="gap-1.5 text-xs font-normal py-1 px-3">
                <GitBranch className="h-3 w-3" />
                Open source · MIT
              </Badge>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.05]">
              Every grant,<br />
              <span className="opacity-30">found in</span>{' '}
              <span className="relative">
                seconds
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-foreground/20 rounded-full" />
              </span>
            </h1>

            {/* Animated source types */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-2 leading-relaxed">
              <TypewriterCycle
                words={['Federal grants.', 'State grants.', 'Foundation grants.', 'Corporate grants.']}
                className="font-semibold text-foreground"
              />
              {' '}All in one place.
            </p>
            <p className="text-base text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Open source AI that reads the fine print, checks your eligibility, and surfaces only the grants that match your mission — in seconds.
            </p>

            {/* Checklist */}
            <ul className="space-y-3 mb-8">
              {[
                'Search federal, state, foundation & corporate sources at once',
                'Get plain-English summaries of complex requirements',
                'Know your eligibility before you apply',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-foreground p-1 shrink-0">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                  <span className="text-sm text-muted-foreground leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <Link href="/register">
                <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-lg shadow-foreground/10 hover:shadow-foreground/20 transition-shadow">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/sakshit2004/Nexar-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-5 text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 rounded-lg border border-border hover:border-foreground/30"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>

          {/* Right: animated search visualization */}
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl pointer-events-none" />
            <GrantVisualization />
          </div>
        </div>
      </section>

      {/* Feature Grid - Minimal */}
      <section className="relative py-16 px-4 bg-muted/20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything you need.
              <br />
              <span className="opacity-40">Nothing you don&apos;t.</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-x-16 gap-y-16 max-w-4xl mx-auto">
            {[
              {
                title: 'AI Matching',
                description: 'Personalized grant recommendations based on your profile and focus areas'
              },
              {
                title: 'Smart Search',
                description: 'Natural language search across federal grants with AI-powered discovery'
              },
              {
                title: 'Plain English',
                description: 'AI-generated summaries that translate complex grant requirements into clear language'
              },
              {
                title: 'Eligibility',
                description: 'Eligibility requirements displayed for each grant so you know before you apply'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-6">
                <div className="text-lg font-semibold mb-3 group-hover:translate-x-1 transition-transform">
                  {feature.title}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Bold & Simple */}
      <section className="relative py-16 px-4 bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Stop searching.
            <br />
            Start finding.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
