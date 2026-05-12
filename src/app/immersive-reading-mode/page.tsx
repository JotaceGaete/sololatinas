import React, { Suspense } from 'react';
import ImmersiveReaderClient from './components/ImmersiveReaderClient';

export default function ImmersiveReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0B0A] flex items-center justify-center">
          <p className="text-[#9A8A7A] text-sm animate-pulse">Cargando relato...</p>
        </div>
      }
    >
      <ImmersiveReaderClient />
    </Suspense>
  );
}
