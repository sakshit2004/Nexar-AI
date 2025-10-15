'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Check,
  ChevronRight
} from 'lucide-react';
import { GrantVisualization } from '@/components/landing/GrantVisualization';

export default function Home() {
  const demoRef = useRef<HTMLElement>(null);
  
  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Minimalist, Bold */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-6">
            <Badge variant="outline" className="text-xs px-3 py-1">
              Backed by AI
            </Badge>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            Federal grants,{' '}
            <span className="block mt-2">
              <span className="opacity-40">found in</span> seconds
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Stop wasting weeks searching databases.
            <br />
            AI finds grants that actually match your work.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base font-medium">
                Start searching
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

      {/* Stats Bar */}
      <section className="border-y py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Organizations using Nexar</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$250M+</div>
              <div className="text-sm text-muted-foreground">In grants discovered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10min</div>
              <div className="text-sm text-muted-foreground">Average search time</div>
            </div>
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
                Our AI analyzes thousands of federal grants in real-time, 
                matching them to your organization's profile, mission, and eligibility.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-foreground p-1">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                  <span className="text-base">Search across all federal agencies simultaneously</span>
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
              <span className="opacity-40">Nothing you don't.</span>
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

      {/* Social Proof - Minimal */}
      <section className="py-32 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by organizations like yours
            </h2>
          </div>
          
          <div className="space-y-12">
            {[
              {
                quote: "We secured $250K in our first 6 months. The AI matching is incredibly accurate.",
                author: "Sarah Mitchell",
                role: "Executive Director",
                org: "Nonprofit"
              },
              {
                quote: "Nexar AI cut our grant research time from weeks to hours. Game changer for our lab.",
                author: "Dr. James Chen",
                role: "Principal Investigator",
                org: "Research University"
              },
              {
                quote: "Finally, federal grants that actually make sense for small businesses like ours.",
                author: "Maria Rodriguez",
                role: "Founder",
                org: "Clean Tech Startup"
              }
            ].map((testimonial, i) => (
              <div key={i} className="border-l-2 border-foreground pl-6 py-2">
                <p className="text-lg mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.org}</div>
                  </div>
                </div>
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
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium border-background text-background hover:bg-background/10">
                Browse grants
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-60 mt-8">
            No credit card required • Free forever plan
          </p>
        </div>
      </section>
    </div>
  );
}
