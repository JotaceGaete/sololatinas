import React, { Suspense } from 'react';
import ImmersiveReaderClient from './components/ImmersiveReaderClient';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0D0B0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#9A8A7A] text-sm">Cargando relato…</p>
      </div>
    </div>
  );
}

export default function ImmersiveReadingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ImmersiveReaderClient />
    </Suspense>
  );
}
