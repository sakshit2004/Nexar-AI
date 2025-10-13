'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Search, 
  FileText, 
  Target, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-zinc-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-zinc-900/25 -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <Badge className="mb-4 border-2 border-black dark:border-white" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Grant Discovery
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              Find Federal Grants{' '}
              <span className="gradient-text">in Minutes</span>, Not Weeks
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Stop drowning in 40-page PDFs. Get AI-powered grant matching, plain-English summaries, 
              and personalized recommendations for US federal funding opportunities.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base">
                  Get Started Free
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="text-base">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Grants
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ No credit card required  ✓ Free tier available  ✓ Access federal grants database
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-2 border-black dark:border-white">
              <Zap className="h-3 w-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to win grants
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI tools designed for nonprofits, researchers, and businesses seeking federal funding
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Smart Search</CardTitle>
                <CardDescription>
                  Filter federal grants by category, amount, deadline, and eligibility in seconds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>AI Matching</CardTitle>
                <CardDescription>
                  Get personalized grant recommendations based on your organization profile
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Plain-English Summaries</CardTitle>
                <CardDescription>
                  Skip 40-page PDFs. Get clear, concise summaries of requirements and deadlines
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Eligibility Analysis</CardTitle>
                <CardDescription>
                  Know instantly if you qualify before investing hours in an application
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Deadline Tracking</CardTitle>
                <CardDescription>
                  Never miss a deadline with automated reminders and a centralized calendar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-foreground transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle>Success Tracking</CardTitle>
                <CardDescription>
                  Track your application pipeline and learn from your grant history
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section - Removed hardcoded stats */}

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to find your perfect grant?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            Join thousands of organizations using AI to simplify federal grant discovery
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-base bg-background text-foreground hover:bg-background/90">
                Start Free Trial
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
