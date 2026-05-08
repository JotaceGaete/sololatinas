'use client';

import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
