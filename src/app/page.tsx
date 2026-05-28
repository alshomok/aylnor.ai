'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import LandingNav from './components/LandingNav';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import CreatorSection from './components/CreatorSection';
import CtaSection from './components/CtaSection';
import LandingFooter from './components/LandingFooter';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect logged-in users to chat page
    if (!loading && user) {
      router.push('/chat-page');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero star-field">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CreatorSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
