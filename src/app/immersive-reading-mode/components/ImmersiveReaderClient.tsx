'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import StoryCard from '@/components/ui/StoryCard';
import { createClient } from '@/lib/supabase/client';
import { isPublishedRelato, mapRelatoToStory } from '@/lib/supabase/mappers';
import type { Story } from '@/lib/stories/types';
import { renderStoryHtml, splitIntoPages } from '@/lib/stories/render';
import type { SupabaseRelato } from '@/lib/supabase/mappers';
import { X, ChevronLeft, BookmarkPlus, Share2, Heart, Sun, Moon, Coffee, Type, Minus, Plus, Eye, BookOpen, AlignJustify, ArrowLeft, ArrowRight, Library, Sparkles, CheckCircle } from 'lucide-react';
import StoryReactions from './StoryReactions';
import StoryComments from './StoryComments';

type ReaderTheme = 'dark' | 'sepia' | 'cream';
type ReadingMode = 'paginated' | 'scroll';
type FontFamily = 'serif' | 'sans';

const WORDS_PER_PAGE_MIN = 1200;
const WORDS_PER_PAGE_MAX = 1800;
const TARGET_WORDS_PER_PAGE = 1500;

const themeConfig: Record<ReaderTheme, { bg: string; text: string; label: string; icon: React.ReactNode; panelBg: string; borderColor: string }> = {
  dark: {
    bg: 'bg-[#0D0B0A]',
    text: 'text-[#F5EFE6]',
    label: 'Oscuro',
    icon: <Moon size={14} />,
    panelBg: 'bg-[#221D1A]',
    borderColor: 'border-[#2E2420]',
  },
  sepia: {
    bg: 'bg-[#2C1F0E]',
    text: 'text-[#E8D5B0]',
    label: 'Sepia',
    icon: <Coffee size={14} />,
    panelBg: 'bg-[#3A2A14]',
    borderColor: 'border-[#5A3E20]',
  },
  cream: {
    bg: 'bg-[#F5EFE6]',
    text: 'text-[#2C1F0E]',
    label: 'Claro',
    icon: <Sun size={14} />,
    panelBg: 'bg-[#EDE5D8]',
    borderColor: 'border-[#C4A882]',
  },
};

const fontFamilies: Record<FontFamily, { label: string; class: string }> = {
  serif: { label: 'Literaria', class: 'font-display' },
  sans: { label: 'Moderna', class: 'font-sans' },
};

function splitIntoPagesLocal(text: string, targetWords = TARGET_WORDS_PER_PAGE): string[] {
  return splitIntoPages(text, targetWords, WORDS_PER_PAGE_MIN, WORDS_PER_PAGE_MAX);
}

function showToast(message: string) {
  // Simple toast via DOM since we can't import sonner safely
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#221D1A;color:#F5EFE6;border:1px solid #C9A96E;
    padding:12px 20px;border-radius:12px;font-size:14px;z-index:9999;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);pointer-events:none;
    animation:fadeInUp 0.3s ease;
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => document.body.removeChild(el), 300);
  }, 2500);
}

export default function ImmersiveReaderClient() {
  const searchParams = useSearchParams();
  const relatoId = searchParams.get('id');
  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [loadingStory, setLoadingStory] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchStory() {
      setLoadingStory(true);
      try {
        const relatedQuery = supabase
          .from('relatos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (relatoId) {
          const [{ data: selected }, { data: relatedData }, { count: chapterCount }] = await Promise.all([
            supabase.from('relatos').select('*').eq('id', relatoId).maybeSingle(),
            relatedQuery.neq('id', relatoId),
            supabase.from('historia_capitulos').select('id', { count: 'exact', head: true }).eq('historia_id', relatoId),
          ]);

          const selectedRelato = selected as SupabaseRelato | null;
          const mappedStory = selectedRelato && isPublishedRelato(selectedRelato)
            ? mapRelatoToStory({ ...selectedRelato, chapter_count: chapterCount ?? 0 })
            : null;
          setStory(mappedStory);
          setRelated(((relatedData ?? []) as SupabaseRelato[]).filter(isPublishedRelato).map(mapRelatoToStory));
        } else {
          const { data } = await relatedQuery;
          const stories = ((data ?? []) as SupabaseRelato[]).filter(isPublishedRelato).map(mapRelatoToStory);
          setStory(stories[0] ?? null);
          setRelated(stories.slice(1));
        }
      } catch {
        setStory(null);
        setRelated([]);
      } finally {
        setLoadingStory(false);
      }
    }

    fetchStory();
  }, [relatoId]);

  const fullText = useMemo(() => story ? (story.fullText || story.excerpt) : '', [story]);
  const pages = useMemo(() => story ? splitIntoPagesLocal(fullText) : [''], [story, fullText]);
  const totalPages = pages.length;

  const [theme, setTheme] = useState<ReaderTheme>('dark');
  const [fontSize, setFontSize] = useState(19);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [readingMode, setReadingMode] = useState<ReadingMode>('paginated');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubscribed] = useState(true);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (story) setLikeCount(story.likes);
  }, [story]);

  const contentRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  const tc = themeConfig[theme];
  const ff = fontFamilies[fontFamily];

  // Scroll progress for scroll mode
  useEffect(() => {
    if (readingMode !== 'scroll') return;
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingMode]);

  // Paginated progress
  const paginatedProgress = readingMode === 'paginated' ? Math.round((currentPage / totalPages) * 100) : scrollProgress;

  const scrollToTop = useCallback(() => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    scrollToTop();
    if (page === totalPages) {
      setTimeout(() => setShowEndScreen(true), 400);
    } else {
      setShowEndScreen(false);
    }
  }, [totalPages, scrollToTop]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked((v) => !v);
    showToast(isBookmarked ? 'Marcador eliminado' : 'Relato guardado en tus marcadores 🔖');
  };

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((v) => v - 1);
    } else {
      setIsLiked(true);
      setLikeCount((v) => v + 1);
      showToast('¡Le has dado amor a este relato 💛');
    }
  };

  const handleShare = () => {
    showToast('Enlace copiado al portapapeles 🔗');
  };

  const switchMode = (mode: ReadingMode) => {
    setReadingMode(mode);
    setModePickerOpen(false);
    setCurrentPage(1);
    setShowEndScreen(false);
    scrollToTop();
  };

  const topBarBg = theme === 'cream' ?'bg-[#F5EFE6]/95 border-b border-[#C4A882]' :'bg-[#0D0B0A]/95 border-b border-[#2E2420]';

  const topBarText = theme === 'cream' ? 'text-[#2C1F0E]' : 'text-[#F5EFE6]';
  const topBarMuted = theme === 'cream' ? 'text-[#8B6914]' : 'text-[#9A8A7A]';

  if (loadingStory) {
    return (
      <div className="min-h-screen bg-[#0D0B0A] flex items-center justify-center">
        <p className="text-[#9A8A7A] text-sm animate-pulse">Cargando relato...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0D0B0A] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <BookOpen size={48} className="text-[#C9A96E]/40" />
        <h2 className="font-display text-2xl font-bold text-[#F5EFE6]">
          No hay relatos disponibles
        </h2>
        <p className="text-[#9A8A7A] max-w-sm">
          Aún no se han publicado relatos. Vuelve pronto o comparte el primero.
        </p>
        <Link href="/stories-library" className="px-6 py-3 bg-[#C9A96E] text-[#0D0B0A] rounded-xl font-semibold text-sm hover:bg-[#E8C97A] transition-all">
          Ver biblioteca
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tc.bg}`}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pageSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-animate { animation: pageSlideIn 0.4s ease; }
        @keyframes endScreenIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .end-screen-animate { animation: endScreenIn 0.5s ease; }
        .story-html-content p { margin-bottom: 1.75rem; text-align: justify; }
        .story-html-content h1,.story-html-content h2,.story-html-content h3 { font-family: var(--font-display); color: #C9A96E; margin: 1.5rem 0 0.75rem; font-weight: 700; }
        .story-html-content h1 { font-size: 1.6em; }
        .story-html-content h2 { font-size: 1.35em; }
        .story-html-content h3 { font-size: 1.15em; }
        .story-html-content blockquote { border-left: 3px solid #C9A96E; padding-left: 1.25rem; margin: 1.25rem 0; font-style: italic; opacity: 0.85; }
        .story-html-content strong { font-weight: 700; }
        .story-html-content em { font-style: italic; }
        .story-html-content hr { border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 2rem 0; }
        .story-html-content br { display: block; content: ""; margin-bottom: 0.5rem; }
      `}</style>

      {/* ── FIXED TOP BAR ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${topBarBg}`}>
        {/* Progress bar */}
        <div className="h-0.5 bg-transparent">
          <div
            className="h-full bg-[#C9A96E] transition-all duration-300"
            style={{ width: `${paginatedProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 lg:px-8 h-14 gap-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/stories-library"
              className={`flex items-center gap-1 text-xs shrink-0 transition-colors ${topBarMuted} hover:text-[#C9A96E]`}
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Biblioteca</span>
            </Link>
            <span className={`text-xs ${topBarMuted} hidden sm:block`}>|</span>
            <span className={`text-xs font-medium truncate hidden sm:block ${topBarText}`}>
              {story.title}
            </span>
          </div>

          {/* Center: Progress indicator (paginated) */}
          {readingMode === 'paginated' && (
            <div className={`flex items-center gap-2 text-xs ${topBarMuted} shrink-0`}>
              <span className="hidden xs:inline">Página</span>
              <span className={`font-semibold ${topBarText}`}>{currentPage}</span>
              <span>de</span>
              <span className={`font-semibold ${topBarText}`}>{totalPages}</span>
              <span className="hidden sm:inline ml-1 opacity-60">· {paginatedProgress}%</span>
            </div>
          )}
          {readingMode === 'scroll' && (
            <div className={`text-xs ${topBarMuted} shrink-0 hidden sm:block`}>
              {Math.round(scrollProgress)}% leído
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mode toggle */}
            <div className="relative">
              <button
                onClick={() => setModePickerOpen((v) => !v)}
                className={`p-2 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
                  modePickerOpen
                    ? 'text-[#C9A96E] bg-[#C9A96E]/10'
                    : `${topBarMuted} hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`
                }`}
                title="Modo de lectura"
              >
                {readingMode === 'paginated' ? <BookOpen size={15} /> : <AlignJustify size={15} />}
                <span className="hidden md:inline">{readingMode === 'paginated' ? 'Paginado' : 'Scroll'}</span>
              </button>

              {modePickerOpen && (
                <div className={`absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-2xl overflow-hidden z-50 ${tc.panelBg} ${tc.borderColor}`}>
                  <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest border-b ${topBarMuted} ${tc.borderColor}`}>
                    Modo de lectura
                  </div>
                  {(['paginated', 'scroll'] as ReadingMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => switchMode(mode)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                        readingMode === mode
                          ? 'text-[#C9A96E] bg-[#C9A96E]/10'
                          : `${topBarText} hover:bg-[#C9A96E]/5`
                      }`}
                    >
                      {mode === 'paginated' ? <BookOpen size={16} /> : <AlignJustify size={16} />}
                      <div className="text-left">
                        <div className="font-medium">{mode === 'paginated' ? 'Paginado' : 'Scroll continuo'}</div>
                        <div className={`text-xs mt-0.5 ${topBarMuted}`}>
                          {mode === 'paginated' ? 'Recomendado para relatos largos' : 'Lectura fluida sin interrupciones'}
                        </div>
                      </div>
                      {readingMode === mode && <CheckCircle size={14} className="ml-auto text-[#C9A96E]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-all ${
                isBookmarked ? 'text-[#C9A96E] bg-[#C9A96E]/10' : `${topBarMuted} hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`
              }`}
              aria-label="Guardar relato"
            >
              <BookmarkPlus size={15} />
            </button>
            <button
              onClick={handleShare}
              className={`p-2 rounded-lg transition-all ${topBarMuted} hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`}
              aria-label="Compartir relato"
            >
              <Share2 size={15} />
            </button>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`p-2 rounded-lg transition-all ${
                settingsOpen ? 'text-[#C9A96E] bg-[#C9A96E]/10' : `${topBarMuted} hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`
              }`}
              aria-label="Ajustes de lectura"
            >
              <Type size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {settingsOpen && (
        <div
          className={`fixed top-16 right-4 lg:right-8 z-40 rounded-2xl p-5 w-72 shadow-2xl border ${tc.panelBg} ${tc.borderColor}`}
          style={{ animation: 'pageSlideIn 0.25s ease' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-sm font-semibold ${topBarText}`}>Ajustes de Lectura</h3>
            <button onClick={() => setSettingsOpen(false)} className={`${topBarMuted} hover:text-[#C9A96E]`}>
              <X size={16} />
            </button>
          </div>

          {/* Font Size */}
          <div className="mb-5">
            <p className={`text-xs mb-2.5 flex items-center gap-1.5 ${topBarMuted}`}>
              <Type size={12} /> Tamaño de texto
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className={`p-2 rounded-lg border transition-all ${tc.borderColor} ${topBarMuted} hover:text-[#C9A96E] hover:border-[#C9A96E]/40`}
              >
                <Minus size={13} />
              </button>
              <span className={`text-sm tabular-nums w-12 text-center font-medium ${topBarText}`}>{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(30, s + 2))}
                className={`p-2 rounded-lg border transition-all ${tc.borderColor} ${topBarMuted} hover:text-[#C9A96E] hover:border-[#C9A96E]/40`}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div className="mb-5">
            <p className={`text-xs mb-2.5 ${topBarMuted}`}>Tipografía</p>
            <div className="flex gap-2">
              {(Object.entries(fontFamilies) as [FontFamily, typeof fontFamilies.serif][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFontFamily(key)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs transition-all ${config.class} ${
                    fontFamily === key
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                      : `${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/30`
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <p className={`text-xs mb-2.5 ${topBarMuted}`}>Tema de lectura</p>
            <div className="flex gap-2">
              {(Object.entries(themeConfig) as [ReaderTheme, typeof themeConfig.dark][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-xs transition-all ${
                    theme === key
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                      : `${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/30`
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close overlays */}
      {(settingsOpen || modePickerOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setSettingsOpen(false); setModePickerOpen(false); }}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div ref={pageTopRef} className="pt-16">
        <div className="px-4 sm:px-6 pb-8">
          <article className="max-w-2xl mx-auto">

            {/* Cover Image — only on first page / scroll mode */}
            {(readingMode === 'scroll' || currentPage === 1) && (
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-10 mt-8">
                <AppImage
                  src={story.coverImage}
                  alt={`Ilustración artística para el relato ${story.title} - escena romántica con iluminación cálida y dorada`}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
            )}

            {/* Chapters banner — if this relato has chapters */}
            {story.hasChapters && story.slug && (readingMode === 'scroll' || currentPage === 1) && (
              <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#C9A96E]/30 bg-[#C9A96E]/5">
                <p className={`text-sm ${topBarMuted}`}>
                  Este relato tiene capítulos — ver la historia completa.
                </p>
                <a
                  href={`/historia/${story.slug}`}
                  className="flex-shrink-0 text-xs font-semibold text-[#C9A96E] hover:text-[#E8C97A] transition-colors"
                >
                  Ver capítulos →
                </a>
              </div>
            )}

            {/* Story Header — only on first page / scroll mode */}
            {(readingMode === 'scroll' || currentPage === 1) && (
              <div className="mb-10 text-center">
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {story.tags.map((tag) => (
                    <span
                      key={`tag-${tag}`}
                      className="text-xs px-2.5 py-1 rounded-full border border-[#C9A96E]/30 text-[#C9A96E] bg-[#C9A96E]/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <h1
                  className={`font-display font-bold leading-tight mb-4 ${tc.text}`}
                  style={{ fontSize: `${Math.max(fontSize + 12, 30)}px` }}
                >
                  {story.title}
                </h1>
                <div className={`flex items-center justify-center gap-4 text-sm ${topBarMuted}`}>
                  <span className="font-medium text-[#C9A96E]">{story.author}</span>
                  <span>·</span>
                  <span>{story.country}</span>
                  <span>·</span>
                  <span>{story.readingTime} min de lectura</span>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-sm transition-all ${
                      isLiked ? 'text-[#E8A598]' : `${topBarMuted} hover:text-[#E8A598]`
                    }`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-[#E8A598]' : ''} />
                    {likeCount.toLocaleString('es')}
                  </button>
                  <span className={`flex items-center gap-1.5 text-sm ${topBarMuted}`}>
                    <Eye size={16} />
                    {story.views.toLocaleString('es')} lecturas
                  </span>
                </div>
                <div className="mt-8 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
              </div>
            )}

            {/* ── PAGINATED MODE ── */}
            {readingMode === 'paginated' && (
              <div ref={contentRef} key={`page-${currentPage}`} className="page-animate">
                {/* Page number indicator (top of page, subtle) */}
                {currentPage > 1 && (
                  <div className={`text-center mb-8 text-xs ${topBarMuted}`}>
                    — Página {currentPage} de {totalPages} —
                  </div>
                )}

                {/* Page content */}
                <div
                  className={`story-html-content leading-[1.95] ${tc.text} ${ff.class}`}
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] ?? '' }}
                />

                {/* ── END SCREEN (last page) ── */}
                {currentPage === totalPages && (
                  <div className="end-screen-animate mt-16 mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent mb-12" />

                    <div className="text-center">
                      {/* Fin del relato */}
                      <div className="inline-flex items-center gap-3 mb-6">
                        <div className="h-px w-12 bg-[#C9A96E]/40" />
                        <Sparkles size={18} className="text-[#C9A96E]" />
                        <div className="h-px w-12 bg-[#C9A96E]/40" />
                      </div>
                      <p className={`font-display text-2xl italic mb-2 ${tc.text}`}>
                        Fin del relato
                      </p>
                      <p className={`text-sm mb-10 ${topBarMuted}`}>— {story.author}</p>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <button
                          onClick={handleLike}
                          className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                            isLiked
                              ? 'bg-[#E8A598]/15 border-[#E8A598]/50 text-[#E8A598]'
                              : `${tc.borderColor} ${topBarMuted} hover:border-[#E8A598]/50 hover:text-[#E8A598] hover:bg-[#E8A598]/5`
                          }`}
                        >
                          <Heart size={16} className={isLiked ? 'fill-[#E8A598]' : ''} />
                          {isLiked ? '¡Me encantó!' : 'Me encantó este relato'}
                        </button>

                        <Link
                          href="/stories-library"
                          className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`}
                        >
                          <Sparkles size={16} />
                          Siguiente relato
                        </Link>

                        <Link
                          href="/stories-library"
                          className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`}
                        >
                          <Library size={16} />
                          Volver a la biblioteca
                        </Link>
                      </div>

                      {/* Reactions */}
                      <div className={`mt-12 pt-10 border-t ${tc.borderColor}`}>
                        <StoryReactions relatoId={story.id} theme={theme} />
                      </div>

                      {/* Comments toggle */}
                      <div className={`mt-10 pt-8 border-t ${tc.borderColor}`}>
                        <button
                          onClick={() => setShowComments((v) => !v)}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                            showComments
                              ? `border-[#C9A96E]/50 text-[#C9A96E] bg-[#C9A96E]/5`
                              : `${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/40 hover:text-[#C9A96E]`
                          }`}
                        >
                          💬 {showComments ? 'Ocultar comentarios' : 'Ver y dejar comentarios'}
                        </button>
                        {showComments && (
                          <div className="mt-8">
                            <StoryComments relatoId={story.id} theme={theme} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Related stories */}
                    <div className="mt-16">
                      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent mb-10" />
                      <h2 className={`font-display text-xl font-bold text-center mb-6 ${tc.text}`}>
                        Relatos que también te <span className="text-[#C9A96E] italic">van a atrapar</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {related.slice(0, 4).map((s) => (
                          <StoryCard key={`end-related-${s.id}`} story={s} variant="compact" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PAGE NAVIGATION (bottom) ── */}
                {currentPage < totalPages && (
                  <div className="mt-14 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent mb-10" />

                    {/* Progress indicator */}
                    <div className="text-center mb-6">
                      <div className={`text-xs mb-3 ${topBarMuted}`}>
                        Página {currentPage} de {totalPages}
                      </div>
                      {/* Dot indicators */}
                      <div className="flex items-center justify-center gap-1.5">
                        {Array.from({ length: Math.min(totalPages, 9) }).map((_, i) => {
                          const pageNum = totalPages <= 9 ? i + 1 : Math.round((i / 8) * (totalPages - 1)) + 1;
                          const isActive = totalPages <= 9 ? pageNum === currentPage : Math.abs(pageNum - currentPage) < 2;
                          return (
                            <button
                              key={`dot-${i}`}
                              onClick={() => totalPages <= 9 ? goToPage(pageNum) : undefined}
                              className={`rounded-full transition-all ${
                                isActive
                                  ? 'w-6 h-1.5 bg-[#C9A96E]'
                                  : 'w-1.5 h-1.5 bg-[#C9A96E]/25 hover:bg-[#C9A96E]/50'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
                          currentPage === 1
                            ? `${tc.borderColor} opacity-30 cursor-not-allowed ${topBarMuted}`
                            : `${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`
                        }`}
                      >
                        <ArrowLeft size={15} />
                        Página anterior
                      </button>

                      {/* Continue reading — main CTA */}
                      <button
                        onClick={handleNextPage}
                        className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#C9A96E] text-[#0D0B0A] text-sm font-semibold transition-all hover:bg-[#E8C97A] hover:shadow-lg hover:shadow-[#C9A96E]/20 active:scale-[0.98]"
                      >
                        <BookOpen size={16} />
                        Continuar leyendo
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SCROLL MODE ── */}
            {readingMode === 'scroll' && (
              <div ref={contentRef}>
                <div
                  className={`story-html-content leading-[1.95] ${tc.text} ${ff.class}`}
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{ __html: renderStoryHtml(fullText) }}
                />

                {/* End of story in scroll mode */}
                <div className="mt-16 mb-8">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent mb-12" />
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <div className="h-px w-12 bg-[#C9A96E]/40" />
                      <Sparkles size={18} className="text-[#C9A96E]" />
                      <div className="h-px w-12 bg-[#C9A96E]/40" />
                    </div>
                    <p className={`font-display text-2xl italic mb-2 ${tc.text}`}>Fin del relato</p>
                    <p className={`text-sm mb-10 ${topBarMuted}`}>— {story.author}</p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                      <button
                        onClick={handleLike}
                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                          isLiked
                            ? 'bg-[#E8A598]/15 border-[#E8A598]/50 text-[#E8A598]'
                            : `${tc.borderColor} ${topBarMuted} hover:border-[#E8A598]/50 hover:text-[#E8A598] hover:bg-[#E8A598]/5`
                        }`}
                      >
                        <Heart size={16} className={isLiked ? 'fill-[#E8A598]' : ''} />
                        {isLiked ? '¡Me encantó!' : 'Me encantó este relato'}
                      </button>
                      <Link
                        href="/stories-library"
                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`}
                      >
                        <Sparkles size={16} />
                        Siguiente relato
                      </Link>
                      <Link
                        href="/stories-library"
                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-medium transition-all ${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5`}
                      >
                        <Library size={16} />
                        Volver a la biblioteca
                      </Link>
                    </div>

                    {/* Reactions - scroll mode */}
                    <div className={`mt-12 pt-10 border-t ${tc.borderColor}`}>
                      <StoryReactions relatoId={story.id} theme={theme} />
                    </div>

                    {/* Comments - scroll mode */}
                    <div className={`mt-10 pt-8 border-t ${tc.borderColor}`}>
                      <button
                        onClick={() => setShowComments((v) => !v)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                          showComments
                            ? `border-[#C9A96E]/50 text-[#C9A96E] bg-[#C9A96E]/5`
                            : `${tc.borderColor} ${topBarMuted} hover:border-[#C9A96E]/40 hover:text-[#C9A96E]`
                        }`}
                      >
                        💬 {showComments ? 'Ocultar comentarios' : 'Ver y dejar comentarios'}
                      </button>
                      {showComments && (
                        <div className="mt-8">
                          <StoryComments relatoId={story.id} theme={theme} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
