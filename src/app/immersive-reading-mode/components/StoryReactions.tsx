'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REACTIONS = [
  { tipo: 'me_encanto', emoji: '💛', label: 'Me encantó' },
  { tipo: 'inspiradora', emoji: '✨', label: 'Inspiradora' },
  { tipo: 'apasionante', emoji: '🔥', label: 'Apasionante' },
  { tipo: 'emotiva', emoji: '🥹', label: 'Emotiva' },
  { tipo: 'adictiva', emoji: '📖', label: 'Adictiva' },
];

interface ReactionCounts {
  [tipo: string]: number;
}

interface StoryReactionsProps {
  relatoId: string;
  theme?: 'dark' | 'sepia' | 'cream';
}

export default function StoryReactions({ relatoId, theme = 'dark' }: StoryReactionsProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const loginHref = `/sign-up-login-screen?redirect=${encodeURIComponent(pathname)}`;

  const [counts, setCounts] = useState<ReactionCounts>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const isDark = theme !== 'cream';
  const textMuted = isDark ? 'text-[#9A8A7A]' : 'text-[#8B6914]';
  const borderColor = isDark ? 'border-[#2E2420]' : 'border-[#C4A882]';
  const panelBg = isDark ? 'bg-[#221D1A]' : 'bg-[#EDE5D8]';
  const textColor = isDark ? 'text-[#F5EFE6]' : 'text-[#2C1F0E]';

  const fetchReactions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('story_reactions')
        .select('tipo, user_id')
        .eq('relato_id', relatoId);

      if (data) {
        const newCounts: ReactionCounts = {};
        const myReactions = new Set<string>();
        for (const row of data) {
          newCounts[row.tipo] = (newCounts[row.tipo] || 0) + 1;
          if (user && row.user_id === user.id) {
            myReactions.add(row.tipo);
          }
        }
        setCounts(newCounts);
        setUserReactions(myReactions);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [relatoId, user, supabase]);

  useEffect(() => {
    fetchReactions();

    // Real-time subscription
    const channel = supabase
      .channel(`reactions-${relatoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_reactions', filter: `relato_id=eq.${relatoId}` },
        () => { fetchReactions(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [relatoId, fetchReactions, supabase]);

  const handleToggle = async (tipo: string) => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setToggling(tipo);
    const isActive = userReactions.has(tipo);

    // Optimistic update
    setCounts((prev) => ({
      ...prev,
      [tipo]: Math.max(0, (prev[tipo] || 0) + (isActive ? -1 : 1)),
    }));
    setUserReactions((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(tipo);
      else next.add(tipo);
      return next;
    });

    try {
      if (isActive) {
        await supabase
          .from('story_reactions')
          .delete()
          .eq('relato_id', relatoId)
          .eq('user_id', user.id)
          .eq('tipo', tipo);
      } else {
        await supabase
          .from('story_reactions')
          .insert({ relato_id: relatoId, user_id: user.id, tipo });
      }
    } catch {
      // Revert on error
      fetchReactions();
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {REACTIONS.map((r) => (
          <div key={r.tipo} className={`h-10 w-28 rounded-full animate-pulse ${isDark ? 'bg-[#221D1A]' : 'bg-[#EDE5D8]'}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className={`text-xs text-center mb-4 uppercase tracking-widest ${textMuted}`}>
        ¿Cómo te hizo sentir este relato?
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {REACTIONS.map((r) => {
          const isActive = userReactions.has(r.tipo);
          const count = counts[r.tipo] || 0;
          return (
            <button
              key={r.tipo}
              onClick={() => handleToggle(r.tipo)}
              disabled={toggling === r.tipo}
              title={!user ? 'Inicia sesión para reaccionar' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#C9A96E]/20 border-[#C9A96E]/60 text-[#C9A96E] scale-105'
                  : `${borderColor} ${textMuted} hover:border-[#C9A96E]/40 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`
              }`}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span className={`text-xs ${isActive ? 'text-[#C9A96E]' : textMuted}`}>{r.label}</span>
              {count > 0 && (
                <span className={`text-xs font-semibold tabular-nums ${isActive ? 'text-[#C9A96E]' : textMuted}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!user && (
        <p className={`text-xs text-center mt-3 ${textMuted}`}>
          <a href={loginHref} className="text-[#C9A96E] hover:underline">Inicia sesión</a> para dejar tu reacción
        </p>
      )}
    </div>
  );
}
