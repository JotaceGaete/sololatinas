'use client';

import React, { useState, useMemo } from 'react';
import StoryCard from '@/components/ui/StoryCard';
import { mockStories } from '@/lib/mockData';
import { Search, Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const allTags = ['pasión', 'romance', 'noche', 'encuentro', 'intimidad', 'amor', 'deseo', 'secreto', 'baile', 'verano', 'cartas', 'mar'];
const countries = ['Colombia', 'México', 'Argentina', 'España', 'Venezuela', 'Chile', 'Perú', 'Uruguay'];
const genres = ['Romance', 'Romance Erótico', 'Romance Literario', 'Histórico'];
const readingLengths = [
  { label: 'Corto (< 10 min)', min: 0, max: 10 },
  { label: 'Medio (10–20 min)', min: 10, max: 20 },
  { label: 'Largo (> 20 min)', min: 20, max: 999 },
];
const sortOptions = [
  { value: 'popular', label: 'Más populares' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'likes', label: 'Más amados' },
  { value: 'reading', label: 'Más cortos' },
];

const ITEMS_PER_PAGE = 9;

export default function StoriesLibraryClient() {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLength, setSelectedLength] = useState<string>('');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
    setCurrentPage(1);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCountries([]);
    setSelectedGenres([]);
    setSelectedLength('');
    setShowPremiumOnly(false);
    setSearch('');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...mockStories];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((s) => selectedTags.some((t) => s.tags.includes(t)));
    }

    if (selectedCountries.length > 0) {
      result = result.filter((s) => selectedCountries.includes(s.country));
    }

    if (selectedGenres.length > 0) {
      result = result.filter((s) => selectedGenres.includes(s.genre));
    }

    if (selectedLength) {
      const range = readingLengths.find((r) => r.label === selectedLength);
      if (range) {
        result = result.filter((s) => s.readingTime >= range.min && s.readingTime < range.max);
      }
    }

    if (showPremiumOnly) {
      result = result.filter((s) => s.isPremium);
    }

    result.sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'recent') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'reading') return a.readingTime - b.readingTime;
      return 0;
    });

    return result;
  }, [search, selectedTags, selectedCountries, selectedGenres, selectedLength, sortBy, showPremiumOnly]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeFilterCount =
    selectedTags.length + selectedCountries.length + selectedGenres.length +
    (selectedLength ? 1 : 0) + (showPremiumOnly ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Ordenar por
        </h3>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={`sort-${opt.value}`}
              onClick={() => setSortBy(opt.value)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all ${
                sortBy === opt.value
                  ? 'bg-primary/15 text-primary font-medium' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      {/* Country */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          País de origen
        </h3>
        <div className="space-y-1">
          {countries.map((country) => (
            <label
              key={`filter-country-${country}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCountries.includes(country)}
                onChange={() => toggleCountry(country)}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span className="text-sm text-muted-foreground">{country}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      {/* Genre */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Género
        </h3>
        <div className="space-y-1">
          {genres.map((genre) => (
            <label
              key={`filter-genre-${genre}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span className="text-sm text-muted-foreground">{genre}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      {/* Reading Time */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Tiempo de lectura
        </h3>
        <div className="space-y-1">
          {readingLengths.map((r) => (
            <label
              key={`filter-length-${r.label}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            >
              <input
                type="radio"
                name="reading-length"
                checked={selectedLength === r.label}
                onChange={() => setSelectedLength(selectedLength === r.label ? '' : r.label)}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-sm text-muted-foreground">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      {/* Tags */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Etiquetas
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={`filter-tag-${tag}`}
              onClick={() => toggleTag(tag)}
              className={`tag-pill cursor-pointer ${
                selectedTags.includes(tag) ? 'bg-primary/25 border-primary/50' : ''
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      {/* Premium Toggle */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-muted-foreground">Solo Premium</span>
        <div
          onClick={() => setShowPremiumOnly((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            showPremiumOnly ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform ${
              showPremiumOnly ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </div>
      </label>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="btn-ghost w-full text-xs text-muted-foreground">
          <X size={12} /> Limpiar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-20 min-h-screen">
      {/* Page Header */}
      <div className="bg-surface border-b border-border px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Biblioteca</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Todos los <span className="text-gradient-gold italic">Relatos</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {mockStories.length} historias de {[...new Set(mockStories.map((s) => s.country))].length} países
        </p>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters — Desktop */}
          <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Filter size={14} className="text-primary" /> Filtros
                </h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por título, autora o fragmento..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field w-auto sm:w-48 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={`sort-select-${opt.value}`} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="btn-outline lg:hidden flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedTags.map((tag) => (
                  <span
                    key={`chip-tag-${tag}`}
                    className="flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary text-xs rounded-full border border-primary/30"
                  >
                    #{tag}
                    <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-accent">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedCountries.map((c) => (
                  <span
                    key={`chip-country-${c}`}
                    className="flex items-center gap-1 px-3 py-1 bg-accent/15 text-accent text-xs rounded-full border border-accent/30"
                  >
                    {c}
                    <button onClick={() => toggleCountry(c)} className="ml-1 hover:text-primary">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Results Count */}
            <p className="text-xs text-muted-foreground mb-5">
              {filtered.length} relatos encontrados
              {currentPage > 1 && ` — Página ${currentPage} de ${totalPages}`}
            </p>

            {/* Story Grid */}
            {paginated.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-5 mb-8">
                {paginated.map((story) => (
                  <StoryCard key={`library-story-${story.id}`} story={story} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface border border-border rounded-xl">
                <BookOpen size={40} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">
                  No encontramos relatos con esos filtros
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Prueba con otros términos o elimina algunos filtros para ver más historias.
                </p>
                <button onClick={clearFilters} className="btn-outline">
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={`page-${page}`}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm rounded-md transition-all ${
                        page === currentPage
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] flex animate-fade-in lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-80 h-full bg-surface border-l border-border overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}