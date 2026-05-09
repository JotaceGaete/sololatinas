'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { ViewsAreaChart, CountryBarChart } from './AdminStatsChart';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, BookOpen, Users, Star, Settings, Shield,
  ChevronRight, Search, Filter, CheckCircle, XCircle, Eye, Trash2,
  TrendingUp, AlertTriangle, Clock, Menu, X, LogOut, RefreshCw,
  Image as ImageIcon, ChevronDown, BarChart2,
} from 'lucide-react';

type AdminTab = 'dashboard' | 'moderation' | 'users' | 'featured' | 'settings';

interface RelatoAdmin {
  id: string;
  titulo: string;
  extracto: string | null;
  tags: string[] | null;
  pais: string | null;
  imagen_url: string | null;
  vistas: number | null;
  likes: number | null;
  estado: string;
  tiempo_lectura: number | null;
  created_at: string;
  autor_id: string | null;
}

const adminNavItems = [
  { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'moderation' as AdminTab, label: 'Moderación', icon: <Shield size={18} /> },
  { id: 'users' as AdminTab, label: 'Usuarios', icon: <Users size={18} /> },
  { id: 'featured' as AdminTab, label: 'Destacados', icon: <Star size={18} /> },
  { id: 'settings' as AdminTab, label: 'Configuración', icon: <Settings size={18} /> },
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
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [storyStatuses, setStoryStatuses] = useState<Record<string, string>>({});
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [relatos, setRelatos] = useState<RelatoAdmin[]>([]);
  const [loadingRelatos, setLoadingRelatos] = useState(true);
  const [authorCount, setAuthorCount] = useState(0);

  useEffect(() => {
    fetchRelatos();
  }, []);

  async function fetchRelatos() {
    setLoadingRelatos(true);
    const { data, error } = await supabase
      .from('relatos')
      .select('id, titulo, extracto, tags, pais, imagen_url, vistas, likes, estado, tiempo_lectura, created_at, autor_id')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar relatos: ' + error.message);
      setLoadingRelatos(false);
      return;
    }

    const list = (data as RelatoAdmin[]) ?? [];
    setRelatos(list);
    setStoryStatuses(Object.fromEntries(list.map((r) => [r.id, r.estado])));
    const distinct = new Set(list.map((r) => r.autor_id).filter(Boolean));
    setAuthorCount(distinct.size);
    console.log('ADMIN_RELATOS_SOURCE', { source: 'supabase', count: list.length });
    setLoadingRelatos(false);
  }

  const totalStories = relatos.length;
  const pendingModeration = relatos.filter((r) => r.estado === 'revision').length;
  const totalViews = relatos.reduce((sum, r) => sum + (r.vistas ?? 0), 0);
  const featuredCount = Object.values(storyStatuses).filter((s) => s === 'destacado').length;
  const conversionRate = 18.4;

  const filteredRelatos = relatos.filter((r) =>
    (r.titulo ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filteredRelatos.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRelatos.map((r) => r.id));
    }
  };

  const handleStatusChange = async (relatoId: string, newStatus: string) => {
    const { error } = await supabase.from('relatos').update({ estado: newStatus }).eq('id', relatoId);
    if (error) { toast.error('Error al actualizar estado: ' + error.message); return; }
    setStoryStatuses((prev) => ({ ...prev, [relatoId]: newStatus }));
    setRelatos((prev) => prev.map((r) => r.id === relatoId ? { ...r, estado: newStatus } : r));
    setOpenStatusDropdown(null);
    toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
  };

  const handleApprove = (id: string) => handleStatusChange(id, 'publicado');
  const handleReject = (id: string) => handleStatusChange(id, 'archivado');
  const handleFeature = (id: string) => handleStatusChange(id, 'destacado');

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin-login');
    router.refresh();
  };

  const handleDelete = async (relatoId: string) => {
    const { error } = await supabase.from('relatos').delete().eq('id', relatoId);
    if (error) { toast.error('Error al eliminar relato: ' + error.message); return; }
    setRelatos((prev) => prev.filter((r) => r.id !== relatoId));
    setStoryStatuses((prev) => { const n = { ...prev }; delete n[relatoId]; return n; });
    setConfirmDelete(null);
    toast.success('Relato eliminado de la plataforma');
  };

  const handleBulkApprove = async () => {
    await Promise.all(selectedRows.map((id) => handleStatusChange(id, 'publicado')));
    toast.success(`${selectedRows.length} relatos aprobados`);
    setSelectedRows([]);
  };

  const handleGenerateImage = (relatoId: string) => {
    toast.info('Generando imagen artística con IA... (integración pendiente con API de imágenes)');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : sidebarOpen ? 'w-56' : 'w-16'} transition-all duration-300`}>
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-border ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
        <AppLogo size={28} />
        {(sidebarOpen || mobile) && (
          <span className="font-display text-sm font-semibold text-gradient-gold truncate">SoloLatinas</span>
        )}
      </div>

      {(sidebarOpen || mobile) && (
        <div className="mx-3 mt-3 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-primary font-semibold">Panel de Administración</p>
        </div>
      )}

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {adminNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const badge = item.id === 'moderation' && pendingModeration > 0 ? pendingModeration : null;
          return (
            <button
              key={`admin-nav-${item.id}`}
              onClick={() => { setActiveTab(item.id); if (mobile) setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${
                isActive ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              } ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}
              title={!sidebarOpen && !mobile ? item.label : undefined}
            >
              {item.icon}
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
              {badge && (sidebarOpen || mobile) && (
                <span className="ml-auto w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
              )}
              {badge && !sidebarOpen && !mobile && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}
        >
          <Eye size={18} />
          {(sidebarOpen || mobile) && <span>Ver sitio</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {(sidebarOpen || mobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col bg-surface border-r border-border flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? '224px' : '64px' }}
      >
        <Sidebar />
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 h-full bg-surface border-r border-border">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
              <p className="text-xs text-muted-foreground hidden sm:block">
                {totalStories} relatos en Supabase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-white/5 transition-all"
              onClick={() => { fetchRelatos(); toast.info('Datos actualizados'); }}
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

        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Relatos', value: loadingRelatos ? '—' : totalStories, icon: <BookOpen size={18} />, color: 'text-primary', trend: 'Desde Supabase' },
                  { label: 'En Revisión', value: loadingRelatos ? '—' : pendingModeration, icon: <AlertTriangle size={18} />, color: 'text-amber-400', trend: 'Requieren atención', alert: pendingModeration > 0 },
                  { label: 'Vistas Totales', value: loadingRelatos ? '—' : `${(totalViews / 1000).toFixed(1)}k`, icon: <Eye size={18} />, color: 'text-green-400', trend: 'Acumulado' },
                  { label: 'Autoras Activas', value: loadingRelatos ? '—' : authorCount, icon: <Users size={18} />, color: 'text-accent', trend: 'Con relatos' },
                  { label: 'Destacados', value: loadingRelatos ? '—' : featuredCount, icon: <Star size={18} />, color: 'text-gold-light', trend: 'Activos en portada' },
                  { label: 'Conversión', value: `${conversionRate}%`, icon: <TrendingUp size={18} />, color: 'text-primary', trend: '+2.1% vs ayer' },
                ].map((stat) => (
                  <div
                    key={`admin-stat-${stat.label}`}
                    className={`bg-surface border rounded-xl p-4 ${stat.alert ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'}`}
                  >
                    <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                    <p className={`font-display text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{stat.trend}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  <CountryBarChart />
                </div>
              </div>

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
                  {relatos.filter((r) => r.estado === 'revision').slice(0, 3).map((relato) => (
                    <div
                      key={`pending-quick-${relato.id}`}
                      className="flex items-center justify-between gap-3 p-3 bg-surface-elevated border border-border rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{relato.titulo}</p>
                        <p className="text-xs text-muted-foreground">{relato.pais ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(relato.id)}
                          className="px-2.5 py-1 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/25 transition-all"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(relato.id)}
                          className="px-2.5 py-1 text-xs bg-red-500/15 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/25 transition-all"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                  {!loadingRelatos && relatos.filter((r) => r.estado === 'revision').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ✓ No hay relatos pendientes de revisión
                    </p>
                  )}
                  {loadingRelatos && (
                    <div className="h-16 rounded-lg bg-surface-elevated animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <button className="btn-outline flex items-center gap-2 text-sm">
                  <Filter size={14} /> Filtrar
                </button>
              </div>

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
                    <button onClick={() => setSelectedRows([])} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {loadingRelatos ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Cargando relatos...</div>
                ) : filteredRelatos.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No hay relatos en Supabase</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface-elevated">
                          <th className="p-4 text-left w-10">
                            <input
                              type="checkbox"
                              checked={selectedRows.length === filteredRelatos.length && filteredRelatos.length > 0}
                              onChange={toggleAllRows}
                              className="w-3.5 h-3.5 accent-primary"
                            />
                          </th>
                          <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relato</th>
                          <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">País</th>
                          <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Fecha</th>
                          <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Vistas</th>
                          <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                          <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredRelatos.map((relato) => {
                          const currentStatus = storyStatuses[relato.id] ?? relato.estado;
                          const isSelected = selectedRows.includes(relato.id);
                          return (
                            <tr
                              key={`admin-story-row-${relato.id}`}
                              className={`group transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-elevated'}`}
                            >
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRow(relato.id)}
                                  className="w-3.5 h-3.5 accent-primary"
                                />
                              </td>
                              <td className="p-4 max-w-xs">
                                <p className="font-medium text-foreground truncate">{relato.titulo}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {(relato.extracto ?? '').slice(0, 60)}{relato.extracto && relato.extracto.length > 60 ? '...' : ''}
                                </p>
                              </td>
                              <td className="p-4 hidden lg:table-cell">
                                <span className="text-muted-foreground text-xs">{relato.pais ?? '—'}</span>
                              </td>
                              <td className="p-4 hidden xl:table-cell">
                                <span className="text-muted-foreground text-xs tabular-nums">
                                  {new Date(relato.created_at).toLocaleDateString('es')}
                                </span>
                              </td>
                              <td className="p-4 hidden lg:table-cell">
                                <span className="text-muted-foreground text-xs tabular-nums">
                                  {(relato.vistas ?? 0).toLocaleString('es')}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenStatusDropdown(openStatusDropdown === relato.id ? null : relato.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${statusColors[currentStatus] ?? statusColors.borrador}`}
                                  >
                                    {statusLabels[currentStatus] ?? currentStatus}
                                    <ChevronDown size={10} />
                                  </button>
                                  {openStatusDropdown === relato.id && (
                                    <div className="absolute left-0 top-8 z-20 bg-surface-elevated border border-border rounded-lg shadow-xl min-w-36 py-1 animate-fade-up">
                                      {Object.entries(statusLabels).map(([key, label]) => (
                                        <button
                                          key={`status-opt-${relato.id}-${key}`}
                                          onClick={() => handleStatusChange(relato.id, key)}
                                          className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${currentStatus === key ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full ${(statusColors[key] ?? '').split(' ')[0]}`} />
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
                                        onClick={() => handleApprove(relato.id)}
                                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-md transition-all"
                                        title="Aprobar relato"
                                      >
                                        <CheckCircle size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleReject(relato.id)}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                        title="Rechazar relato"
                                      >
                                        <XCircle size={15} />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleFeature(relato.id)}
                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                    title="Destacar relato"
                                  >
                                    <Star size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleGenerateImage(relato.id)}
                                    className="p-1.5 text-accent hover:bg-accent/10 rounded-md transition-all"
                                    title="Generar imagen con IA"
                                  >
                                    <ImageIcon size={15} />
                                  </button>
                                  <Link
                                    href={`/immersive-reading-mode?id=${relato.id}&preview=1`}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-all"
                                    title="Vista previa"
                                  >
                                    <Eye size={15} />
                                  </Link>
                                  <button
                                    onClick={() => setConfirmDelete(relato.id)}
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
                )}

                <div className="p-4 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filteredRelatos.length} relatos · {Object.values(storyStatuses).filter((s) => s === 'publicado').length} publicados
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

          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                {[
                  { label: 'Total Usuarias', value: '2,847', trend: '+124 este mes' },
                  { label: 'Suscriptoras Premium', value: '412', trend: '14.5% del total' },
                  { label: 'Autoras Registradas', value: String(authorCount), trend: 'Con relatos en Supabase' },
                  { label: 'Activas Hoy', value: '318', trend: 'Pico: 22:00h' },
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
                  {[
                    { name: 'Catalina Mejía', email: 'catalina@gmail.com', role: 'Lectora', country: 'Colombia', joined: '06/05/2026', status: 'activa' },
                    { name: 'Fernanda Ortiz', email: 'fernanda@hotmail.com', role: 'Autora', country: 'México', joined: '05/05/2026', status: 'activa' },
                    { name: 'Paola Vega', email: 'paola.v@yahoo.com', role: 'Lectora', country: 'Argentina', joined: '04/05/2026', status: 'activa' },
                    { name: 'Rossana Blanco', email: 'rossana@gmail.com', role: 'Premium', country: 'Chile', joined: '03/05/2026', status: 'activa' },
                    { name: 'Mariela Torres', email: 'mariela.t@gmail.com', role: 'Lectora', country: 'Venezuela', joined: '02/05/2026', status: 'suspendida' },
                    { name: 'Luciana Herrera', email: 'lu.herrera@gmail.com', role: 'Autora', country: 'Uruguay', joined: '01/05/2026', status: 'activa' },
                  ].map((user) => (
                    <div key={`admin-user-${user.email}`} className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{user.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground hidden md:block">{user.country}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        user.role === 'Autora' ? 'bg-accent/15 text-accent border-accent/30' :
                        user.role === 'Premium' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'
                      }`}>{user.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        user.status === 'activa' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>{user.status}</span>
                      <span className="text-xs text-muted-foreground hidden lg:block tabular-nums">{user.joined}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Gestiona qué relatos aparecen en la portada y secciones destacadas. Máximo 6 relatos destacados simultáneos.
              </p>
              {loadingRelatos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-surface border border-border animate-pulse" />)}
                </div>
              ) : relatos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">No hay relatos en Supabase</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {relatos.map((relato) => {
                    const isFeatured = storyStatuses[relato.id] === 'destacado';
                    return (
                      <div
                        key={`featured-mgmt-${relato.id}`}
                        className={`bg-surface border rounded-xl p-4 transition-all ${isFeatured ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20'}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{relato.titulo}</h4>
                          <button
                            onClick={() => handleStatusChange(relato.id, isFeatured ? 'publicado' : 'destacado')}
                            className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${isFeatured ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                            title={isFeatured ? 'Quitar de destacados' : 'Destacar relato'}
                          >
                            <Star size={16} className={isFeatured ? 'fill-primary' : ''} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{relato.pais ?? '—'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye size={11} /> {(relato.vistas ?? 0).toLocaleString('es')}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {relato.tiempo_lectura ?? '—'} min</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${statusColors[storyStatuses[relato.id] ?? relato.estado] ?? statusColors.borrador}`}>
                            {statusLabels[storyStatuses[relato.id] ?? relato.estado] ?? relato.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                        <p className="text-xs text-muted-foreground/60 mb-1.5">{field.help}</p>
                        <input type={field.type} defaultValue={field.value} className="input-field" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border flex justify-end">
                    <button className="btn-primary text-sm" onClick={() => toast.success('Configuración guardada ✓')}>
                      Guardar cambios
                    </button>
                  </div>
                </div>
              ))}

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
                        className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${toggle.enabled ? 'bg-primary' : 'bg-muted'}`}
                        onClick={() => toast.info('Configuración actualizada')}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform ${toggle.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-surface-elevated border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Eliminar relato</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción es permanente. El relato y todos sus datos serán eliminados de la plataforma.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 justify-center text-sm">
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
