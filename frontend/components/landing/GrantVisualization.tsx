'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp } from 'lucide-react';

export function GrantVisualization() {
  const [activeStep, setActiveStep] = useState(0);
  const [grants, setGrants] = useState<Array<{ id: number; visible: boolean; matched: boolean }>>([]);

  useEffect(() => {
    // Animation sequence
    const sequence = [
      { step: 0, delay: 0 },
      { step: 1, delay: 1500 },
      { step: 2, delay: 3000 },
      { step: 3, delay: 4500 },
    ];

    sequence.forEach(({ step, delay }) => {
      setTimeout(() => setActiveStep(step), delay);
    });

    // Add grants with stagger
    const grantTimers = [
      setTimeout(() => setGrants([{ id: 1, visible: true, matched: false }]), 1800),
      setTimeout(() => setGrants(prev => [...prev, { id: 2, visible: true, matched: false }]), 2200),
      setTimeout(() => setGrants(prev => [...prev, { id: 3, visible: true, matched: false }]), 2600),
      setTimeout(() => {
        // Mark grants as matched
        setGrants(prev => prev.map(g => ({ ...g, matched: true })));
      }, 3500),
    ];

    // Loop the animation
    const loopTimer = setInterval(() => {
      setActiveStep(0);
      setGrants([]);
      
      sequence.forEach(({ step, delay }) => {
        setTimeout(() => setActiveStep(step), delay);
      });
      
      setTimeout(() => setGrants([{ id: 1, visible: true, matched: false }]), 1800);
      setTimeout(() => setGrants(prev => [...prev, { id: 2, visible: true, matched: false }]), 2200);
      setTimeout(() => setGrants(prev => [...prev, { id: 3, visible: true, matched: false }]), 2600);
      setTimeout(() => {
        setGrants(prev => prev.map(g => ({ ...g, matched: true })));
      }, 3500);
    }, 7000);

    return () => {
      grantTimers.forEach(timer => clearTimeout(timer));
      clearInterval(loopTimer);
    };
  }, []);

  return (
    <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl p-8 border-2 overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgb(0 0 0) 1px, transparent 1px), linear-gradient(90deg, rgb(0 0 0) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      
      {/* Animated search pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
        {activeStep >= 1 && (
          <>
            <div className="absolute inset-0 border-2 border-foreground rounded-full animate-ping opacity-20" />
            <div className="absolute inset-4 border-2 border-foreground rounded-full animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-8 border-2 border-foreground rounded-full animate-ping opacity-20" style={{ animationDelay: '0.4s' }} />
          </>
        )}
      </div>

      <div className="relative h-full flex flex-col justify-between">
        {/* Search bar */}
        <div className={`transition-all duration-500 ${activeStep >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="bg-background border-2 rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-sm text-muted-foreground">
              <span className="inline-block">
                {activeStep >= 0 && (
                  <span className="animate-pulse">Clean energy research</span>
                )}
              </span>
            </div>
            {activeStep >= 1 && (
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Grant results */}
        <div className="space-y-3 flex-1 flex flex-col justify-center py-4">
          {grants.map((grant, index) => (
            <div
              key={grant.id}
              className={`bg-background border-2 rounded-lg p-4 transition-all duration-500 ${
                grant.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              } ${
                grant.matched ? 'border-foreground shadow-lg' : 'border-border'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-sm">
                  {grant.matched && <TrendingUp className="inline h-3 w-3 mr-1 text-foreground" />}
                  Grant Match
                  {grant.matched && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">95% fit</span>
                  )}
                </div>
                <Badge variant={grant.matched ? "default" : "outline"} className="text-xs">
                  {['DOE', 'NSF', 'NIH'][index]}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className={`h-2 rounded-full transition-all duration-700 ${
                  grant.matched ? 'bg-foreground' : 'bg-muted'
                }`} style={{ width: '85%' }} />
                <div className={`h-2 rounded-full transition-all duration-700 delay-100 ${
                  grant.matched ? 'bg-foreground' : 'bg-muted'
                }`} style={{ width: '65%' }} />
              </div>

              {grant.matched && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground animate-fade-in">
                  $100K - $500K • Deadline: 6 months
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats footer */}
        {activeStep >= 3 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground animate-fade-in bg-background/50 backdrop-blur-sm border rounded-lg px-3 py-2">
            <span>3 matches found</span>
            <span>•</span>
            <span>0.8s search time</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
              </span>
              Live
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

