'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { ViewsAreaChart, CountryBarChart } from './AdminStatsChart';
import type { CountryChartEntry } from './AdminStatsChart';
import { createClient } from '@/lib/supabase/client';
import { mapRelatoToStory } from '@/lib/supabase/mappers';
import type { SupabaseRelato, SupabaseProfile } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, BookOpen, Users, Star, Settings, Shield, ChevronRight, Search, Filter, CheckCircle, XCircle, Eye, Trash2, AlertTriangle, Clock, Menu, X, LogOut, RefreshCw, Image as ImageIcon, ChevronDown, BarChart2 } from 'lucide-react';

type AdminStory = ReturnType<typeof mapRelatoToStory>;

type AdminTab = 'dashboard' | 'moderation' | 'users' | 'featured' | 'settings';

const adminNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'moderation', label: 'Moderación', icon: <Shield size={18} /> },
  { id: 'users', label: 'Usuarios', icon: <Users size={18} /> },
  { id: 'featured', label: 'Destacados', icon: <Star size={18} /> },
  { id: 'settings', label: 'Configuración', icon: <Settings size={18} /> },
];

const statusColors: Record<string, string> = {
  publicado: 'bg-green-500/15 text-green-400 border-green-500/30',
  destacado: 'bg-primary/15 text-primary border-primary/30',
  revision: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  borrador: 'bg-muted text-muted-foreground border-border',
  archivado: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  publicado: 'Publicado',
  destacado: 'Destacado',
  revision: 'En Revisión',
  borrador: 'Borrador',
  archivado: 'Archivado',
};

export default function AdminPanelClient() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [users, setUsers] = useState<SupabaseProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [storyStatuses, setStoryStatuses] = useState<Record<string, string>>({});
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/sign-up-login-screen');
      return;
    }
    isAdmin().then((allowed) => {
      setAdminAllowed(allowed);
      setAdminChecked(true);
    });
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-up-login-screen');
  };

  useEffect(() => {
    if (!adminAllowed) return;
    const supabase = createClient();

    async function fetchStories() {
      try {
        const { data } = await supabase
          .from('relatos')
          .select('*, autor:user_profiles(full_name, avatar_url, country, bio)')
          .order('created_at', { ascending: false });
        if (data) {
          const mapped = (data as SupabaseRelato[]).map(mapRelatoToStory);
          setStories(mapped);
          setStoryStatuses(Object.fromEntries(mapped.map((s) => [s.id, s.status])));
        }
      } catch { /* show empty state */ }
      setLoadingStories(false);
    }

    async function fetchUsers() {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, country, bio, role, created_at')
          .order('created_at', { ascending: false });
        if (data) setUsers(data as SupabaseProfile[]);
      } catch { /* show empty state */ }
      setLoadingUsers(false);
    }

    Promise.all([fetchStories(), fetchUsers()]).then(() => {
      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      );
    });
  }, [adminAllowed]);

  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!adminAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-red-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Acceso denegado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            No tienes permisos de administrador para acceder a este panel.
          </p>
          <Link href="/" className="btn-primary text-sm inline-flex">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const totalStories = stories.length;
  const pendingModeration = stories.filter((s) => s.status === 'revision').length;
  const totalViews = stories.reduce((sum, s) => sum + s.views, 0);
  const activeAuthors = [...new Set(stories.map((s) => s.authorId))].length;
  const featuredCount = Object.values(storyStatuses).filter((s) => s === 'destacado').length;
  const uniqueCountries = [...new Set(users.map((u) => u.country).filter(Boolean))].length;

  const filteredStories = stories.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filteredStories.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredStories.map((s) => s.id));
    }
  };

  const handleStatusChange = (storyId: string, newStatus: string) => {
    setStoryStatuses((prev) => ({ ...prev, [storyId]: newStatus }));
    setOpenStatusDropdown(null);
    const supabase = createClient();
    supabase
      .from('relatos')
      .update({ estado: newStatus })
      .eq('id', storyId)
      .then(({ error }) => {
        if (error) toast.error('Error al actualizar el estado');
        else toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
      });
  };

  const handleApprove = (storyId: string) => {
    handleStatusChange(storyId, 'publicado');
  };

  const handleReject = (storyId: string) => {
    handleStatusChange(storyId, 'archivado');
  };

  const handleFeature = (storyId: string) => {
    handleStatusChange(storyId, 'destacado');
  };

  const handleDelete = (storyId: string) => {
    setConfirmDelete(null);
    const supabase = createClient();
    supabase
      .from('relatos')
      .delete()
      .eq('id', storyId)
      .then(({ error }) => {
        if (error) {
          toast.error('Error al eliminar el relato');
        } else {
          setStories((prev) => prev.filter((s) => s.id !== storyId));
          setStoryStatuses((prev) => { const next = { ...prev }; delete next[storyId]; return next; });
          toast.success('Relato eliminado de la plataforma');
        }
      });
  };

  const handleBulkApprove = () => {
    const newStatuses = { ...storyStatuses };
    selectedRows.forEach((id) => { newStatuses[id] = 'publicado'; });
    setStoryStatuses(newStatuses);
    toast.success(`${selectedRows.length} relatos aprobados`);
    setSelectedRows([]);
  };

  const handleGenerateImage = (storyId: string) => {
    // AI IMAGE GENERATION INTEGRATION POINT:
    // Use story tags to call image generation API (e.g. Grok/DALL-E)
    // Environment variable: process.env.NEXT_PUBLIC_IMAGE_API_KEY
    // Endpoint: process.env.NEXT_PUBLIC_IMAGE_API_URL
    // Payload: { tags: story.tags, style: 'romantic_latin', aspect_ratio: '3:4' }
    toast.info('Generando imagen artística con IA... (integración pendiente con API de imágenes)');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : sidebarOpen ? 'w-56' : 'w-16'} transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-border ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
        <AppLogo size={28} />
        {(sidebarOpen || mobile) && (
          <span className="font-display text-sm font-semibold text-gradient-gold truncate">
            SoloLatinas
          </span>
        )}
      </div>

      {/* Admin badge */}
      {(sidebarOpen || mobile) && (
        <div className="mx-3 mt-3 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-primary font-semibold">Panel de Administración</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {adminNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const badge = item.id === 'moderation' ? pendingModeration : 0;
          return (
            <button
              key={`admin-nav-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                if (mobile) setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${
                isActive
                  ? 'bg-primary/15 text-primary font-medium' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
              } ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}
              title={!sidebarOpen && !mobile ? item.label : undefined}
            >
              {item.icon}
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
              {badge > 0 && (sidebarOpen || mobile) && (
                <span className="ml-auto w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
              {badge > 0 && !sidebarOpen && !mobile && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${
            !sidebarOpen && !mobile ? 'justify-center' : ''
          }`}
        >
          <Eye size={18} />
          {(sidebarOpen || mobile) && <span>Ver sitio</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all ${
            !sidebarOpen && !mobile ? 'justify-center' : ''
          }`}
        >
          <LogOut size={18} />
          {(sidebarOpen || mobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-surface border-r border-border flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? '224px' : '64px' }}
      >
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 h-full bg-surface border-r border-border">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-white/5 transition-all"
              aria-label="Colapsar sidebar"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-md"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {adminNavItems.find((n) => n.id === activeTab)?.label}
              </h1>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Última actualización: {lastUpdated}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-white/5 transition-all"
              onClick={() => toast.info('Datos actualizados')}
              aria-label="Refrescar datos"
            >
              <RefreshCw size={16} />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">A</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { label: 'Total Relatos', value: totalStories, icon: <BookOpen size={18} />, color: 'text-primary', trend: 'Todos los relatos' },
                  { label: 'En Revisión', value: pendingModeration, icon: <AlertTriangle size={18} />, color: 'text-amber-400', trend: pendingModeration > 0 ? 'Requieren atención' : 'Sin pendientes', alert: pendingModeration > 0 },
                  { label: 'Vistas Totales', value: totalViews > 0 ? `${(totalViews / 1000).toFixed(1)}k` : '0', icon: <Eye size={18} />, color: 'text-green-400', trend: 'Acumulado total' },
                  { label: 'Autoras Activas', value: activeAuthors, icon: <Users size={18} />, color: 'text-accent', trend: 'Con al menos un relato' },
                  { label: 'Destacados', value: featuredCount, icon: <Star size={18} />, color: 'text-gold-light', trend: 'En portada ahora' },
                ].map((stat) => (
                  <div
                    key={`admin-stat-${stat.label}`}
                    className={`bg-surface border rounded-xl p-4 ${
                      stat.alert ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'
                    }`}
                  >
                    <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                    <p className={`font-display text-2xl font-bold tabular-nums ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{stat.trend}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              {(() => {
                const countryMap = new Map<string, number>();
                stories.forEach((s) => countryMap.set(s.country, (countryMap.get(s.country) ?? 0) + 1));
                const countriesChartData = Array.from(countryMap.entries()).map(([country, count]) => ({
                  country, count, color: 'var(--primary)',
                }));
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
                    <div className="bg-surface border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Vistas y Likes — Últimos 30 días</h3>
                        <BarChart2 size={16} className="text-muted-foreground" />
                      </div>
                      <ViewsAreaChart />
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground">Relatos por País</h3>
                        <BarChart2 size={16} className="text-muted-foreground" />
                      </div>
                      <CountryBarChart data={countriesChartData} />
                    </div>
                  </div>
                );
              })()}

              {/* Pending Moderation Quick View */}
              <div className="bg-surface border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    Pendientes de Moderación
                  </h3>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="text-xs text-primary hover:text-gold-light flex items-center gap-1 transition-colors"
                  >
                    Ver todos <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {loadingStories ? (
                    <div className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                  ) : stories.filter((s) => storyStatuses[s.id] === 'revision').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ✓ No hay relatos pendientes de revisión
                    </p>
                  ) : (
                    stories.filter((s) => storyStatuses[s.id] === 'revision').slice(0, 3).map((story) => (
                      <div
                        key={`pending-quick-${story.id}`}
                        className="flex items-center justify-between gap-3 p-3 bg-surface-elevated border border-border rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{story.title}</p>
                          <p className="text-xs text-muted-foreground">{story.author} · {story.country}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(story.id)}
                            className="px-2.5 py-1 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/25 transition-all"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(story.id)}
                            className="px-2.5 py-1 text-xs bg-red-500/15 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/25 transition-all"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODERATION TAB */}
          {activeTab === 'moderation' && (
            <div className="space-y-5">
              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por título o autora..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <button className="btn-outline flex items-center gap-2 text-sm">
                  <Filter size={14} /> Filtrar
                </button>
              </div>

              {/* Bulk Action Bar */}
              {selectedRows.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/30 rounded-xl animate-fade-in">
                  <span className="text-sm text-primary font-medium">
                    {selectedRows.length} relato{selectedRows.length > 1 ? 's' : ''} seleccionado{selectedRows.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkApprove}
                      className="px-3 py-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/25 transition-all font-medium"
                    >
                      Aprobar todos
                    </button>
                    <button
                      onClick={() => setSelectedRows([])}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated">
                        <th className="p-4 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === filteredStories.length && filteredStories.length > 0}
                            onChange={toggleAllRows}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Relato
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                          Autora
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                          País
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">
                          Publicado
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                          Vistas
                        </th>
                        <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Estado
                        </th>
                        <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStories.map((story) => {
                        const currentStatus = storyStatuses[story.id] || story.status;
                        const isSelected = selectedRows.includes(story.id);
                        return (
                          <tr
                            key={`admin-story-row-${story.id}`}
                            className={`group transition-colors ${
                              isSelected ? 'bg-primary/5' : 'hover:bg-surface-elevated'
                            }`}
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRow(story.id)}
                                className="w-3.5 h-3.5 accent-primary"
                              />
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="font-medium text-foreground truncate">{story.title}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
                                {story.excerpt.slice(0, 60)}...
                              </p>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <span className="text-muted-foreground">{story.author}</span>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                              <span className="text-muted-foreground text-xs">{story.country}</span>
                            </td>
                            <td className="p-4 hidden xl:table-cell">
                              <span className="text-muted-foreground text-xs tabular-nums">
                                {story.publishedAt}
                              </span>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                              <span className="text-muted-foreground text-xs tabular-nums">
                                {story.views.toLocaleString('es')}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="relative">
                                <button
                                  onClick={() => setOpenStatusDropdown(
                                    openStatusDropdown === story.id ? null : story.id
                                  )}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${statusColors[currentStatus]}`}
                                >
                                  {statusLabels[currentStatus]}
                                  <ChevronDown size={10} />
                                </button>
                                {openStatusDropdown === story.id && (
                                  <div className="absolute left-0 top-8 z-20 bg-surface-elevated border border-border rounded-lg shadow-xl min-w-36 py-1 animate-fade-up">
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                      <button
                                        key={`status-opt-${story.id}-${key}`}
                                        onClick={() => handleStatusChange(story.id, key)}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                          currentStatus === key ? 'text-primary font-medium' : 'text-muted-foreground'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[key].split(' ')[0]}`} />
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentStatus === 'revision' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(story.id)}
                                      className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-md transition-all"
                                      title="Aprobar relato"
                                    >
                                      <CheckCircle size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleReject(story.id)}
                                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                      title="Rechazar relato"
                                    >
                                      <XCircle size={15} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleFeature(story.id)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                  title="Destacar relato"
                                >
                                  <Star size={15} />
                                </button>
                                <button
                                  onClick={() => handleGenerateImage(story.id)}
                                  className="p-1.5 text-accent hover:bg-accent/10 rounded-md transition-all"
                                  title="Generar imagen con IA"
                                >
                                  <ImageIcon size={15} />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(story.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                  title="Eliminar relato"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filteredStories.length} relatos · {Object.values(storyStatuses).filter((s) => s === 'publicado').length} publicados
                  </p>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                      <ChevronRight size={14} className="rotate-180" />
                    </button>
                    <span className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded font-semibold">1</span>
                    <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                {[
                  { label: 'Total Usuarias', value: loadingUsers ? '…' : users.length.toString(), trend: 'Registradas en la plataforma' },
                  { label: 'Autoras Activas', value: loadingUsers ? '…' : activeAuthors.toString(), trend: 'Con al menos un relato' },
                  { label: 'Países', value: loadingUsers ? '…' : uniqueCountries.toString(), trend: 'Representados en la comunidad' },
                ].map((s) => (
                  <div key={`user-stat-${s.label}`} className="bg-surface border border-border rounded-xl p-4">
                    <p className="font-display text-2xl font-bold text-primary tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{s.trend}</p>
                  </div>
                ))}
              </div>

              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Usuarias Recientes</h3>
                </div>
                <div className="divide-y divide-border">
                  {loadingUsers ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={`user-skel-${i}`} className="flex items-center gap-4 p-4">
                        <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-muted/40 rounded animate-pulse w-32" />
                          <div className="h-2.5 bg-muted/30 rounded animate-pulse w-48" />
                        </div>
                      </div>
                    ))
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No hay usuarias registradas aún</p>
                    </div>
                  ) : (
                    users.map((u) => {
                      const displayName = u.full_name ?? 'Usuaria';
                      const joinedDate = new Date(u.created_at).toLocaleDateString('es', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      });
                      const isAuthor = u.role === 'author' || u.role === 'autora' || u.role === 'admin';
                      return (
                        <div key={`admin-user-${u.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</p>
                          </div>
                          {u.country && <span className="text-xs text-muted-foreground hidden md:block">{u.country}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            u.role === 'admin' ? 'bg-primary/15 text-primary border-primary/30' :
                            isAuthor ? 'bg-accent/15 text-accent border-accent/30' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>{u.role ?? 'reader'}</span>
                          <span className="text-xs text-muted-foreground hidden lg:block tabular-nums">{joinedDate}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FEATURED TAB */}
          {activeTab === 'featured' && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Gestiona qué relatos aparecen en la portada y secciones destacadas. Máximo 6 relatos destacados simultáneos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
                {stories.map((story) => {
                  const isFeatured = storyStatuses[story.id] === 'destacado';
                  return (
                    <div
                      key={`featured-mgmt-${story.id}`}
                      className={`bg-surface border rounded-xl p-4 transition-all ${
                        isFeatured ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                          {story.title}
                        </h4>
                        <button
                          onClick={() => handleStatusChange(story.id, isFeatured ? 'publicado' : 'destacado')}
                          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                            isFeatured
                              ? 'bg-primary/20 text-primary hover:bg-primary/30' :'bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10'
                          }`}
                          title={isFeatured ? 'Quitar de destacados' : 'Destacar relato'}
                        >
                          <Star size={16} className={isFeatured ? 'fill-primary' : ''} />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{story.author} · {story.country}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye size={11} /> {story.views.toLocaleString('es')}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {story.readingTime} min</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${statusColors[storyStatuses[story.id] || story.status]}`}>
                          {statusLabels[storyStatuses[story.id] || story.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              {[
                {
                  title: 'Configuración de la Plataforma',
                  fields: [
                    { label: 'Nombre del sitio', value: 'SoloLatinas.com', type: 'text', help: 'Aparece en el título del navegador y los emails' },
                    { label: 'Email de contacto', value: 'hola@sololatinas.com', type: 'email', help: 'Para consultas de usuarias y autoras' },
                    { label: 'Palabras del extracto gratuito', value: '200', type: 'number', help: 'Número de palabras visibles antes del paywall' },
                  ],
                },
                {
                  title: 'Generación de Imágenes con IA',
                  fields: [
                    { label: 'API Key (Grok / DALL-E)', value: '••••••••••••••••', type: 'password', help: 'Variable: NEXT_PUBLIC_IMAGE_API_KEY' },
                    { label: 'URL del endpoint', value: 'https://api.x.ai/v1/images/generate', type: 'text', help: 'Variable: NEXT_PUBLIC_IMAGE_API_URL' },
                    { label: 'Estilo por defecto', value: 'romantic_latin_art', type: 'text', help: 'Parámetro de estilo enviado con cada solicitud' },
                  ],
                },
              ].map((section) => (
                <div key={`settings-section-${section.title}`} className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-5">{section.title}</h3>
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={`settings-field-${field.label}`}>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          {field.label}
                        </label>
                        <p className="text-xs text-muted-foreground/60 mb-1.5">{field.help}</p>
                        <input
                          type={field.type}
                          defaultValue={field.value}
                          className="input-field"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border flex justify-end">
                    <button
                      className="btn-primary text-sm"
                      onClick={() => toast.success('Configuración guardada ✓')}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              ))}

              {/* Toggles */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-5">Funcionalidades</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Verificación de edad obligatoria', description: 'Modal de confirmación 18+ al entrar', enabled: true },
                    { label: 'Registro abierto de autoras', description: 'Permitir que nuevas autoras se registren', enabled: true },
                    { label: 'Modo mantenimiento', description: 'Mostrar página de mantenimiento a visitantes', enabled: false },
                    { label: 'Generación automática de imágenes', description: 'Generar imagen al publicar un relato', enabled: false },
                  ].map((toggle) => (
                    <div key={`toggle-${toggle.label}`} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-foreground font-medium">{toggle.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
                      </div>
                      <div
                        className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
                          toggle.enabled ? 'bg-primary' : 'bg-muted'
                        }`}
                        onClick={() => toast.info('Configuración actualizada')}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform ${
                            toggle.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-surface-elevated border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Eliminar relato</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción es permanente. El relato y todos sus datos serán eliminados de la plataforma.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-outline flex-1 justify-center text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 px-4 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-all"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
