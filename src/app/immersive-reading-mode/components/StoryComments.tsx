'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  contenido: string;
  created_at: string;
  autor_id: string | null;
  user_profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface StoryCommentsProps {
  relatoId: string;
  theme?: 'dark' | 'sepia' | 'cream';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function StoryComments({ relatoId, theme = 'dark' }: StoryCommentsProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isDark = theme !== 'cream';
  const textMuted = isDark ? 'text-[#9A8A7A]' : 'text-[#8B6914]';
  const borderColor = isDark ? 'border-[#2E2420]' : 'border-[#C4A882]';
  const panelBg = isDark ? 'bg-[#1A1614]' : 'bg-[#EDE5D8]';
  const inputBg = isDark ? 'bg-[#221D1A]' : 'bg-[#F5EFE6]';
  const textColor = isDark ? 'text-[#F5EFE6]' : 'text-[#2C1F0E]';

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('story_comments')
        .select('id, contenido, created_at, autor_id, user_profiles(full_name, avatar_url)')
        .eq('relato_id', relatoId)
        .order('created_at', { ascending: true });

      if (data) setComments(data as Comment[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [relatoId, supabase]);

  useEffect(() => {
    fetchComments();

    // Real-time subscription
    const channel = supabase
      .channel(`comments-${relatoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_comments', filter: `relato_id=eq.${relatoId}` },
        () => { fetchComments(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [relatoId, fetchComments, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('story_comments').insert({
        relato_id: relatoId,
        autor_id: user.id,
        contenido: newComment.trim(),
      });
      if (insertError) throw insertError;
      setNewComment('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch {
      setError('No se pudo publicar el comentario. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase.from('story_comments').delete().eq('id', commentId).eq('autor_id', user?.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silent
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`flex items-center gap-2 mb-6 ${textColor}`}>
        <MessageCircle size={18} className="text-[#C9A96E]" />
        <h3 className="font-display text-lg font-semibold">
          Comentarios
          {comments.length > 0 && (
            <span className={`ml-2 text-sm font-normal ${textMuted}`}>({comments.length})</span>
          )}
        </h3>
      </div>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className={`flex gap-3 p-3 rounded-xl border ${borderColor} ${inputBg}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/30 flex items-center justify-center text-xs font-semibold text-[#C9A96E]">
              {getInitials(user.email?.split('@')[0] || 'U')}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextareaChange}
                placeholder="Comparte lo que sentiste al leer este relato..."
                rows={2}
                className={`w-full bg-transparent text-sm resize-none outline-none placeholder:${textMuted} ${textColor} leading-relaxed`}
                style={{ minHeight: '48px' }}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C9A96E] text-[#0D0B0A] text-xs font-semibold transition-all hover:bg-[#E8C97A] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                  {submitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className={`mb-8 p-4 rounded-xl border ${borderColor} text-center`}>
          <p className={`text-sm ${textMuted}`}>
            <a href="/sign-up-login-screen" className="text-[#C9A96E] hover:underline font-medium">
              Inicia sesión
            </a>{' '}
            para dejar un comentario
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-[#221D1A]' : 'bg-[#EDE5D8]'}`} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className={`text-center py-8 ${textMuted}`}>
          <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sé la primera en comentar este relato</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const name = comment.user_profiles?.full_name || 'Lectora';
            const isOwn = user?.id === comment.autor_id;
            return (
              <div key={comment.id} className={`flex gap-3 group`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E]/25 flex items-center justify-center text-xs font-semibold text-[#C9A96E]">
                  {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-semibold ${textColor}`}>{name}</span>
                    <span className={`text-[10px] ${textMuted}`}>{timeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${textMuted} hover:text-rose-400`}
                        aria-label="Eliminar comentario"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${textColor} opacity-90`}>{comment.contenido}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
