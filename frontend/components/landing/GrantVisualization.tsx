'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, DollarSign, Building2, Sparkles } from 'lucide-react';

interface Grant {
  id: string;
  title: string;
  agency: string;
  amount: string;
  deadline: string;
  category: string;
  visible: boolean;
  matched: boolean;
}

export function GrantVisualization() {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const fullSearchText = 'renewable energy research';
  
  const grantData: Grant[] = [
    {
      id: '1',
      title: 'Clean Energy Manufacturing Initiative',
      agency: 'Department of Energy',
      amount: '$500,000 - $2,000,000',
      deadline: 'March 15, 2026',
      category: 'Energy',
      visible: false,
      matched: false
    },
    {
      id: '2',
      title: 'Sustainable Energy Systems Research',
      agency: 'National Science Foundation',
      amount: '$250,000 - $750,000',
      deadline: 'April 30, 2026',
      category: 'Research',
      visible: false,
      matched: false
    },
    {
      id: '3',
      title: 'Advanced Solar Technology Development',
      agency: 'DOE - Office of Energy Efficiency',
      amount: '$100,000 - $500,000',
      deadline: 'May 20, 2026',
      category: 'Technology',
      visible: false,
      matched: false
    }
  ];

  useEffect(() => {
    let typeIndex = 0;
    let animationCycle = 0;
    let cursorInterval: NodeJS.Timeout;

    const runAnimation = () => {
      // Reset everything
      setSearchText('');
      setGrants([]);
      setIsSearching(false);
      setShowCursor(true);
      setShowResults(false);
      
      // Cursor blink
      cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 530);
      
      // Typing animation - smoother with variable timing
      const typeCharacter = () => {
        if (typeIndex < fullSearchText.length) {
          setSearchText(fullSearchText.slice(0, typeIndex + 1));
          typeIndex++;
          // Variable timing for more natural feel
          const delay = fullSearchText[typeIndex] === ' ' ? 150 : 70 + Math.random() * 40;
          setTimeout(typeCharacter, delay);
        } else {
          // Stop cursor blink when done typing
          clearInterval(cursorInterval);
          setShowCursor(false);
          
          // Brief pause before searching
          setTimeout(() => {
            setIsSearching(true);
            
            // Searching state
            setTimeout(() => {
              setIsSearching(false);
              setShowResults(true);
              
              // Show grants with smooth stagger
              grantData.forEach((grant, index) => {
                setTimeout(() => {
                  setGrants(prev => {
                    const newGrant = { ...grant, id: `${animationCycle}-${grant.id}`, visible: true };
                    return [...prev, newGrant];
                  });
                  
                  // Match animation slightly after appearance
                  setTimeout(() => {
                    setGrants(prev => prev.map((g, i) => 
                      i === index ? { ...g, matched: true } : g
                    ));
                  }, 400);
                }, index * 500);
              });
            }, 1200);
          }, 400);
        }
      };
      
      // Start typing after short delay
      setTimeout(typeCharacter, 300);

      // Loop animation
      setTimeout(() => {
        typeIndex = 0;
        animationCycle++;
        clearInterval(cursorInterval);
        runAnimation();
      }, 12000);
    };

    runAnimation();

    return () => {
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="relative aspect-square bg-gradient-to-br from-muted/30 via-background to-muted/20 rounded-2xl p-6 sm:p-8 border-2 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(0 0 0) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }} />

      <div className="relative h-full flex flex-col gap-4">
        {/* Search Box with smooth transitions */}
        <div className={`bg-background border-2 rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3 transition-all duration-500 ${
          isSearching ? 'border-foreground scale-[1.02]' : 'border-foreground/60'
        }`}>
          <Search className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
            isSearching ? 'animate-pulse scale-110' : 'scale-100'
          }`} />
          <div className="flex-1 text-base font-medium">
            <span className="transition-all duration-200">
              {searchText}
            </span>
            {showCursor && searchText.length < fullSearchText.length && (
              <span className="inline-block w-0.5 h-5 bg-foreground ml-1 transition-opacity duration-100" />
            )}
            {searchText.length === 0 && (
              <span className="text-muted-foreground font-normal">Search grants...</span>
            )}
          </div>
          {isSearching && (
            <div className="flex gap-1 animate-fade-in">
              <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDuration: '1s' }} />
              <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.15s' }} />
              <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.3s' }} />
            </div>
          )}
        </div>

        {/* Results with smooth entrance */}
        <div className={`flex-1 space-y-3 overflow-y-auto scrollbar-hide transition-opacity duration-700 ${
          showResults ? 'opacity-100' : 'opacity-0'
        }`}>
          {grants.map((grant, index) => (
            <div
              key={grant.id}
              className={`bg-background border-2 rounded-xl p-4 transition-all duration-700 ease-out hover:border-foreground hover:shadow-lg hover:scale-[1.02] cursor-pointer group ${
                grant.visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'
              } ${
                grant.matched ? 'border-foreground/80' : 'border-border'
              }`}
            >
              {/* Header with smooth reveal */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-sm leading-tight flex-1 transition-all duration-300 group-hover:translate-x-0.5">
                  {grant.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs flex-shrink-0 transition-all duration-500 ${
                    grant.matched ? 'bg-foreground text-background border-foreground scale-105' : 'scale-100'
                  }`}
                >
                  {grant.category}
                </Badge>
              </div>

              {/* Agency with smooth transition */}
              <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-3 transition-all duration-500 ${
                grant.matched ? 'opacity-100' : 'opacity-70'
              }`}>
                <Building2 className="h-3.5 w-3.5" />
                <span>{grant.agency}</span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="flex items-start gap-2 transition-all duration-300 group-hover:translate-x-0.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Award Amount</div>
                    <div className="text-xs font-medium truncate">{grant.amount}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 transition-all duration-300 group-hover:translate-x-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Deadline</div>
                    <div className="text-xs font-medium truncate">{grant.deadline}</div>
                  </div>
                </div>
              </div>

              {/* Match indicator with smooth animation */}
              <div className={`mt-3 pt-3 border-t transition-all duration-500 ${
                grant.matched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Match Score
                  </span>
                  <span className="font-semibold tabular-nums">{95 - index * 3}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-foreground transition-all duration-[1500ms] ease-out"
                    style={{ 
                      width: grant.matched ? `${95 - index * 3}%` : '0%',
                      transitionDelay: '200ms'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats with smooth entrance */}
        {grants.length > 0 && grants.every(g => g.matched) && (
          <div className="bg-foreground text-background rounded-lg px-3 py-2.5 flex items-center justify-between text-xs font-medium animate-fade-in shadow-md">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {grants.length} perfect matches
            </span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
              </span>
              <span>0.8s</span>
            </span>
          </div>
        )}
      </div>

      {/* Smooth ambient effects */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-foreground/5 rounded-full blur-3xl transition-all duration-[3000ms] ease-in-out" 
        style={{ 
          transform: isSearching ? 'scale(1.2)' : 'scale(1)',
          opacity: isSearching ? 0.8 : 0.5
        }} 
      />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-foreground/5 rounded-full blur-2xl transition-all duration-[3000ms] ease-in-out" 
        style={{ 
          transform: showResults ? 'scale(1.3)' : 'scale(1)',
          opacity: showResults ? 0.7 : 0.5
        }} 
      />
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
