import React from 'react';

export const runtime = 'edge';

import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import HeroSection from '@/app/components/HeroSection';
import AcclaimedStories from '@/app/components/AcclaimedStories';
import CountrySection from '@/app/components/CountrySection';
import FeaturedAuthorsStrip from '@/app/components/FeaturedAuthorsStrip';
import NewStoriesSection from '@/app/components/NewStoriesSection';
import CtaBanner from '@/app/components/CtaBanner';
import { getPublishedStories, getAuthors } from '@/lib/supabase/queries';

export default async function HomePage() {
  const [stories, authors] = await Promise.all([
    getPublishedStories(),
    getAuthors(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <HeroSection />
      <AcclaimedStories stories={stories} />
      <NewStoriesSection stories={stories} />
      <CountrySection initialStories={stories} />
      <FeaturedAuthorsStrip authors={authors} />
      <CtaBanner />
      <SiteFooter />
    </main>
  );
}
