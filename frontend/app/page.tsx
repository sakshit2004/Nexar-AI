'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowRight,
  Check,
  ChevronRight
} from 'lucide-react';
import { GrantVisualization } from '../components/landing/GrantVisualization';

export default function Home() {
  const demoRef = useRef<HTMLElement>(null);
  
  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Minimalist, Bold */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 -z-10">
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-foreground/4 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-foreground/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s', animationDuration: '9s' }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
          
          {/* Dots pattern - static positions */}
          <div className="absolute inset-0">
            {[
              { top: 15, left: 20, delay: 0, duration: 2.5 },
              { top: 25, left: 75, delay: 0.5, duration: 3 },
              { top: 35, left: 40, delay: 1, duration: 2.8 },
              { top: 45, left: 85, delay: 1.5, duration: 3.2 },
              { top: 55, left: 15, delay: 2, duration: 2.3 },
              { top: 65, left: 60, delay: 2.5, duration: 3.5 },
              { top: 75, left: 30, delay: 0.8, duration: 2.7 },
              { top: 85, left: 70, delay: 1.2, duration: 3.8 },
              { top: 10, left: 50, delay: 1.8, duration: 2.2 },
              { top: 20, left: 90, delay: 2.2, duration: 3.3 },
              { top: 40, left: 10, delay: 0.3, duration: 2.9 },
              { top: 50, left: 55, delay: 1.3, duration: 3.1 },
              { top: 60, left: 25, delay: 1.7, duration: 2.6 },
              { top: 70, left: 80, delay: 2.8, duration: 3.4 },
              { top: 80, left: 45, delay: 0.6, duration: 2.4 },
              { top: 90, left: 65, delay: 1.1, duration: 3.6 },
              { top: 30, left: 35, delay: 1.9, duration: 2.1 },
              { top: 48, left: 72, delay: 0.4, duration: 3.7 },
              { top: 68, left: 12, delay: 2.3, duration: 2.5 },
              { top: 88, left: 58, delay: 1.4, duration: 3.9 }
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-foreground/20 rounded-full animate-pulse"
                style={{
                  top: `${dot.top}%`,
                  left: `${dot.left}%`,
                  animationDelay: `${dot.delay}s`,
                  animationDuration: `${dot.duration}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            Every grant,{' '}
            <span className="block mt-2">
              <span className="opacity-40">found in</span> seconds
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Federal, state, foundation, corporate.
            <br />
            AI discovers all grants that match your mission.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base font-medium">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <button 
              onClick={scrollToDemo}
              className="text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              See how it works
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section ref={demoRef} className="py-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs">
                How it works
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Tell us what you do.
                <br />
                <span className="opacity-40">We find the money.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our AI analyzes federal, state, foundation, and corporate grants in real-time, 
                matching them to your organization&apos;s profile, mission, and eligibility.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-foreground p-1">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                  <span className="text-base">Search federal, state, foundation, and corporate sources simultaneously</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-foreground p-1">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                  <span className="text-base">Get plain-English summaries of complex requirements</span>
          </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-foreground p-1">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                  <span className="text-base">Know your eligibility before you apply</span>
          </li>
              </ul>
            </div>
            
            <div className="relative">
              <GrantVisualization />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-foreground/5 rounded-full blur-3xl"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Minimal */}
      <section className="py-32 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything you need.
              <br />
              <span className="opacity-40">Nothing you don&apos;t.</span>
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                title: 'AI Matching',
                description: 'Personalized recommendations based on your profile and past success'
              },
              {
                title: 'Smart Search',
                description: 'Natural language search across all federal grant databases'
              },
              {
                title: 'Plain English',
                description: 'Complex grant documents translated into clear summaries'
              },
              {
                title: 'Eligibility Check',
                description: 'Know if you qualify before spending time on applications'
              },
              {
                title: 'Deadline Tracking',
                description: 'Never miss an opportunity with automated reminders'
              },
              {
                title: 'Success Analytics',
                description: 'Track your pipeline and learn from application patterns'
              }
            ].map((feature, i) => (
              <div key={i} className="group">
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
      <section className="py-32 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Stop searching.
            <br />
            Start finding.
          </h2>
          <p className="text-xl opacity-80 mb-12">
            Join 500+ organizations discovering grants with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-60 mt-8">
            Session-based • No account required
          </p>
        </div>
      </section>
    </div>
  );
}
