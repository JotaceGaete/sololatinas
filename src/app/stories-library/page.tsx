import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import StoriesLibraryClient from './components/StoriesLibraryClient';

export default function StoriesLibraryPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <StoriesLibraryClient />
      <SiteFooter />
    </main>
  );
}