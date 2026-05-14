import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import StoriesLibraryClient from './components/StoriesLibraryClient';
import { getPublishedStories } from '@/lib/supabase/queries';

export default async function StoriesLibraryPage() {
  const stories = await getPublishedStories();
  console.log('[DIAG StoriesLibraryPage] stories received:', stories.length);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <StoriesLibraryClient initialStories={stories} />
      <SiteFooter />
    </main>
  );
}
