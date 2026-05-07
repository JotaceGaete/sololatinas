import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import HeroSection from '@/app/components/HeroSection';
import AcclaimedStories from '@/app/components/AcclaimedStories';
import CountrySection from '@/app/components/CountrySection';
import FeaturedAuthorsStrip from '@/app/components/FeaturedAuthorsStrip';
import NewStoriesSection from '@/app/components/NewStoriesSection';
import CtaBanner from '@/app/components/CtaBanner';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <HeroSection />
      <AcclaimedStories />
      <NewStoriesSection />
      <CountrySection />
      <FeaturedAuthorsStrip />
      <CtaBanner />
      <SiteFooter />
    </main>
  );
}