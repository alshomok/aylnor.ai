import React from 'react';
import LandingNav from './components/LandingNav';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import CreatorSection from './components/CreatorSection';
import CtaSection from './components/CtaSection';
import LandingFooter from './components/LandingFooter';

export default function LandingPage() {
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