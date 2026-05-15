'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, Pencil, Play, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  userId: string;
  minHeight?: number;
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', icon: 'B', title: 'Negrita (Ctrl+B)', style: 'font-bold' },
  { cmd: 'italic', icon: 'I', title: 'Cursiva (Ctrl+I)', style: 'italic' },
  { cmd: 'underline', icon: 'U', title: 'Subrayado', style: 'underline' },
];

const HEADING_OPTIONS = [
  { label: 'Párrafo', tag: 'p' },
  { label: 'Título 1', tag: 'h1' },
  { label: 'Título 2', tag: 'h2' },
  { label: 'Título 3', tag: 'h3' },
];

const IMAGE_LABELS = ['Ver imagen', 'Ver ilustración', 'Ver escena', 'Ver retrato'];
const VIDEO_LABELS = ['Ver video', 'Ver escena', 'Ver clip'];
const EDITOR_PREVIEW_SELECTOR = '.ch-editor-media-preview';
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;

// Popover state machine
type Popover =
  | null
  | { phase: 'scene-choice' }
  | { phase: 'label'; mediaType: 'image' | 'video'; target?: HTMLElement }
  | { phase: 'upload'; label: string; target?: HTMLElement }
  | { phase: 'url'; label: string; target?: HTMLElement };

// Hover toolbar for existing blocks
interface HoverBlock {
  el: HTMLElement;
  top: number;
  left: number;
  width: number;
}

function getVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([^&?\s/]+)/);
  return match?.[1] ?? null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function getBlockLabel(block: HTMLElement): string {
  const clone = block.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(EDITOR_PREVIEW_SELECTOR).forEach((el) => el.remove());
  return clone.textContent?.trim() || (block.dataset.mediaType === 'video' ? 'Ver video' : 'Ver imagen');
}

function serializeEditorHtml(editor: HTMLElement): string {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(EDITOR_PREVIEW_SELECTOR).forEach((el) => el.remove());
  return clone.innerHTML;
}

function buildEditorMediaPreview(type: 'image' | 'video', url: string) {
  const preview = document.createElement('div');
  preview.className = 'ch-editor-media-preview';
  preview.setAttribute('contenteditable', 'false');

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    preview.appendChild(img);
    return preview;
  }

  const videoId = getVideoId(url);
  if (videoId) {
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    img.alt = '';
    preview.appendChild(img);
  } else if (isDirectVideo(url)) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    preview.appendChild(video);
  }

  const meta = document.createElement('div');
  meta.className = 'ch-editor-media-meta';
  meta.textContent = videoId ? 'Video de YouTube' : 'Video subido';
  preview.appendChild(meta);
  return preview;
}

function decorateMediaBlocks(editor: HTMLElement) {
  editor.querySelectorAll<HTMLElement>('.ch-reveal-block, .ch-media-block').forEach((block) => {
    const type = block.dataset.mediaType === 'video' ? 'video' : 'image';
    const url = block.dataset.mediaUrl ?? '';
    if (!url || block.querySelector(EDITOR_PREVIEW_SELECTOR)) return;
    block.appendChild(buildEditorMediaPreview(type, url));
  });
}

export default function ChapterRichEditor({ value, onChange, placeholder, userId, minHeight = 500 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const revealFileRef = useRef<HTMLInputElement>(null);
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [popover, setPopover] = useState<Popover>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [hoverBlock, setHoverBlock] = useState<HoverBlock | null>(null);

  // ── Sync value → editor innerHTML ─────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
      decorateMediaBlocks(editorRef.current);
    }
    isInternalUpdate.current = false;
  }, [value]);

  // ── Attach hover listeners to existing reveal blocks ──────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const wrap = wrapRef.current;
    if (!editor || !wrap) return;
    const cleanup: Array<() => void> = [];
    decorateMediaBlocks(editor);

    editor.querySelectorAll<HTMLElement>('.ch-reveal-block, .ch-media-block').forEach((block) => {
      const enter = () => {
        if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
        const r = block.getBoundingClientRect();
        const wr = wrap.getBoundingClientRect();
        setHoverBlock({ el: block, top: r.top - wr.top - 40, left: r.left - wr.left, width: r.width });
      };
      const leave = () => {
        hoverLeaveTimer.current = setTimeout(() => setHoverBlock(null), 200);
      };
      block.addEventListener('mouseenter', enter);
      block.addEventListener('mouseleave', leave);
      cleanup.push(() => { block.removeEventListener('mouseenter', enter); block.removeEventListener('mouseleave', leave); });
    });
    return () => cleanup.forEach((fn) => fn());
  }, [value]);

  const notify = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(serializeEditorHtml(editorRef.current));
      requestAnimationFrame(() => {
        if (editorRef.current) decorateMediaBlocks(editorRef.current);
      });
    }
  }, [onChange]);

  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    notify();
  }, [notify]);

  const captureRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const insertHtmlAtSaved = useCallback((html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
    }
    document.execCommand('insertHTML', false, html);
    notify();
  }, [notify]);

  // ── Insert or update a reveal block ───────────────────────────────────────────
  const applyRevealBlock = useCallback((type: 'image' | 'video', url: string, label: string, target?: HTMLElement) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (target) {
      // Editing an existing block
      target.querySelectorAll(EDITOR_PREVIEW_SELECTOR).forEach((el) => el.remove());
      target.setAttribute('data-media-type', type);
      target.setAttribute('data-media-url', url);
      target.textContent = label;
      decorateMediaBlocks(editor);
      notify();
      return;
    }

    editor.focus();
    const block = document.createElement('div');
    block.className = 'ch-reveal-block';
    block.setAttribute('data-media-type', type);
    block.setAttribute('data-media-url', url);
    block.setAttribute('contenteditable', 'false');
    block.textContent = label;

    const gap = document.createElement('p');
    gap.appendChild(document.createElement('br'));

    const sel = window.getSelection();
    let anchorBlock: Element | null = null;
    if (savedRange.current || (sel && sel.rangeCount > 0)) {
      const range = savedRange.current ?? sel!.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;
      while (node && node.parentNode !== editor) node = node.parentNode;
      if (node && node !== editor) anchorBlock = node as Element;
    }

    if (anchorBlock) {
      anchorBlock.after(block, gap);
    } else {
      editor.appendChild(block);
      editor.appendChild(gap);
    }

    const newRange = document.createRange();
    newRange.setStart(gap, 0);
    newRange.collapse(true);
    if (sel) { sel.removeAllRanges(); sel.addRange(newRange); }
    decorateMediaBlocks(editor);

    console.log('[ChapterRichEditor] applyRevealBlock: has data-media-type:', editor.querySelector('[data-media-type]') !== null);
    notify();
  }, [notify]);

  // ── Inline image ──────────────────────────────────────────────────────────────
  const handleInlineFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file); body.append('userId', userId); body.append('folder', 'chapter_images');
      const res = await fetch('/api/r2/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { publicUrl } = await res.json();
      insertHtmlAtSaved(`<figure class="ch-figure"><img src="${publicUrl}" alt="" /><figcaption class="ch-figcaption" data-placeholder="Descripción (opcional)"></figcaption></figure><p></p>`);
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + (err?.message ?? ''));
    } finally { setUploading(false); }
  }, [userId, insertHtmlAtSaved]);

  // ── Upload for reveal block ───────────────────────────────────────────────────
  const handleRevealUpload = useCallback(async (file: File) => {
    if (!popover || popover.phase !== 'upload') return;
    const { label, target } = popover;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file); body.append('userId', userId); body.append('folder', 'chapter_images');
      const res = await fetch('/api/r2/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { publicUrl } = await res.json();
      applyRevealBlock('image', publicUrl, label, target);
      setPopover(null);
    } catch (err: any) {
      toast.error('Error al subir: ' + (err?.message ?? ''));
    } finally { setUploading(false); }
  }, [popover, userId, applyRevealBlock]);

  const handleRevealVideoInsert = useCallback(() => {
    if (!popover || popover.phase !== 'url') return;
    const url = videoUrl.trim();
    if (!url) return;
    applyRevealBlock('video', url, popover.label, popover.target);
    setVideoUrl('');
    setPopover(null);
  }, [popover, videoUrl, applyRevealBlock]);

  const handleRevealVideoUpload = useCallback(async (file: File) => {
    if (!popover || popover.phase !== 'url') return;
    const { label, target } = popover;

    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      toast.error('Formato no soportado. Usa MP4, WebM o MOV.');
      return;
    }

    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      toast.error('El video es demasiado grande. Máximo 250 MB.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file); body.append('userId', userId); body.append('folder', 'chapter_videos');
      const res = await fetch('/api/r2/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { publicUrl } = await res.json();
      applyRevealBlock('video', publicUrl, label, target);
      setVideoUrl('');
      setPopover(null);
    } catch (err: any) {
      toast.error('Error al subir video: ' + (err?.message ?? ''));
    } finally { setUploading(false); }
  }, [popover, userId, applyRevealBlock]);

  // ── Hover block actions ───────────────────────────────────────────────────────
  const handleHoverEditLabel = () => {
    if (!hoverBlock) return;
    const mediaType = (hoverBlock.el.dataset.mediaType as 'image' | 'video') ?? 'image';
    setPopover({ phase: 'label', mediaType, target: hoverBlock.el });
    setHoverBlock(null);
  };

  const handleHoverReplace = () => {
    if (!hoverBlock) return;
    const mediaType = (hoverBlock.el.dataset.mediaType as 'image' | 'video') ?? 'image';
    const currentLabel = getBlockLabel(hoverBlock.el);
    captureRange();
    if (mediaType === 'image') {
      setPopover({ phase: 'upload', label: currentLabel, target: hoverBlock.el });
    } else {
      setPopover({ phase: 'url', label: currentLabel, target: hoverBlock.el });
    }
    setHoverBlock(null);
  };

  const handleHoverDelete = () => {
    if (!hoverBlock) return;
    hoverBlock.el.remove();
    notify();
    setHoverBlock(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleInlineFile(file);
  }, [handleInlineFile]);

  const isEmpty = !value || value === '<br>' || value === '';

  return (
    <div
      ref={wrapRef}
      className="relative flex flex-col border border-border rounded-xl overflow-visible bg-surface focus-within:border-primary/60 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-noir/60 sticky top-0 z-10 rounded-t-xl">
        <select
          onChange={(e) => { editorRef.current?.focus(); document.execCommand('formatBlock', false, e.target.value); notify(); }}
          className="bg-surface border border-border text-foreground text-xs rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:border-primary/60"
          defaultValue="p"
        >
          {HEADING_OPTIONS.map((h) => <option key={h.tag} value={h.tag}>{h.label}</option>)}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {TOOLBAR_BUTTONS.map((btn) => (
          <button key={btn.cmd} type="button" title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); execCmd(btn.cmd); }}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors ${btn.style}`}>
            {btn.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        <button type="button" title="Lista con viñetas" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button type="button" title="Lista numerada" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/>
            <path d="M6 14H4c0-1 2-2 2-3s-1-1-2-1" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button type="button" title="Cita" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-lg leading-none">"
        </button>
        <button type="button" title="Separador" onMouseDown={(e) => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Insertar imagen (inline) */}
        <button type="button" title="Insertar imagen directamente en el texto"
          onMouseDown={(e) => { e.preventDefault(); captureRange(); inlineFileRef.current?.click(); }}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium text-muted-foreground bg-white/5 hover:bg-white/10 border border-border transition-colors disabled:opacity-50"
        >
          {uploading ? <><Loader2 size={12} className="animate-spin" /> Subiendo…</> : <><ImageIcon size={12} /> Insertar imagen</>}
        </button>
        <input ref={inlineFileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInlineFile(f); e.target.value = ''; }} />

        {/* Insertar escena */}
        <button type="button" title="Insertar escena visual"
          onMouseDown={(e) => {
            e.preventDefault();
            captureRange();
            setPopover(popover?.phase === 'scene-choice' ? null : { phase: 'scene-choice' });
          }}
          className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border transition-colors ${
            popover !== null && (popover.phase === 'scene-choice' || (popover as any).mediaType === 'image')
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
          }`}
        >
          <ImageIcon size={12} className="opacity-70" /> Insertar escena
        </button>

        {/* Insertar video */}
        <button type="button" title="Insertar escena de video interactiva"
          onMouseDown={(e) => {
            e.preventDefault();
            captureRange();
            setPopover(popover !== null && popover.phase !== 'scene-choice' && (popover as any).mediaType === 'video' ? null : { phase: 'label', mediaType: 'video' });
          }}
          className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border transition-colors ${
            popover !== null && popover.phase !== 'scene-choice' && (popover as any).mediaType === 'video'
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
          }`}
        >
          <Play size={12} className="opacity-70" /> Insertar video
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button type="button" title="Limpiar formato" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div className="relative" style={{ minHeight }}>
        {isEmpty && (
          <div className="absolute top-6 left-6 text-muted-foreground/40 pointer-events-none font-serif text-lg select-none" style={{ lineHeight: '1.9' }}>
            {placeholder || 'Escribe el contenido del capítulo...'}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={notify}
          onKeyDown={(e) => {
            if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;'); }
          }}
          className="p-6 text-foreground font-serif text-lg leading-relaxed focus:outline-none prose-chapter"
          style={{ minHeight, lineHeight: '1.9' }}
        />
      </div>

      {/* ── Hover block toolbar ───────────────────────────────────────────────── */}
      {hoverBlock && (
        <div
          className="absolute z-30 flex items-center gap-0.5 bg-[#1A1614] border border-[#2E2420] rounded-lg shadow-xl px-1 py-1"
          style={{ top: hoverBlock.top, left: hoverBlock.left }}
          onMouseEnter={() => { if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current); }}
          onMouseLeave={() => { hoverLeaveTimer.current = setTimeout(() => setHoverBlock(null), 150); }}
        >
          <button type="button" onClick={handleHoverEditLabel} title="Cambiar texto"
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-[#C9A96E] hover:bg-white/5 rounded-md transition-colors">
            <Pencil size={10} /> Texto
          </button>
          <button type="button" onClick={handleHoverReplace} title="Reemplazar media"
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-[#C9A96E] hover:bg-white/5 rounded-md transition-colors">
            <RefreshCw size={10} /> Cambiar
          </button>
          <button type="button" onClick={handleHoverDelete} title="Eliminar bloque"
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors">
            <Trash2 size={10} /> Eliminar
          </button>
        </div>
      )}

      {/* ── Narrative insertion popover ───────────────────────────────────────── */}
      {popover && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setPopover(null); setVideoUrl(''); }} />
          {/* Card */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-[#1A1614] border border-[#2E2420] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-[10px] text-[#C9A96E] uppercase tracking-widest font-semibold mb-0.5">
                  {popover.phase === 'scene-choice' || (popover as any).mediaType === 'image' ? 'Escena visual' : 'Escena de video'}
                </p>
                <p className="text-sm font-display font-semibold text-[#F5EFE6]">
                  {popover.phase === 'scene-choice'
                    ? 'Insertar escena'
                    : popover.phase === 'label'
                      ? '¿Cómo llamar esta escena?'
                      : (popover as any).mediaType === 'image'
                        ? 'Sube la imagen'
                        : 'Agrega el video'}
                </p>
              </div>
              <button type="button" onClick={() => { setPopover(null); setVideoUrl(''); }}
                className="p-1.5 text-[#9A8A7A] hover:text-[#F5EFE6] transition-colors rounded-lg hover:bg-white/5">
                <X size={14} />
              </button>
            </div>

            <div className="px-5 pb-5">
              {/* Phase: scene-choice */}
              {popover.phase === 'scene-choice' && (
                <>
                  <p className="text-xs text-[#9A8A7A] mb-4">¿Cómo quieres mostrarla?</p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => { setPopover(null); setTimeout(() => inlineFileRef.current?.click(), 0); }}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[#2E2420] hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/5 transition-all text-left"
                    >
                      <span className="text-base leading-none mt-0.5 opacity-70">🖼</span>
                      <div>
                        <p className="text-sm font-medium text-[#F5EFE6]">Visible en el texto</p>
                        <p className="text-[11px] text-[#9A8A7A] mt-0.5">La imagen aparece directamente en la historia</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopover({ phase: 'label', mediaType: 'image' })}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[#2E2420] hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/5 transition-all text-left"
                    >
                      <span className="text-base leading-none mt-0.5 text-[#C9A96E]">✦</span>
                      <div>
                        <p className="text-sm font-medium text-[#F5EFE6]">Interactiva <span className="text-[#C9A96E] font-normal text-xs">"Ver imagen"</span></p>
                        <p className="text-[11px] text-[#9A8A7A] mt-0.5">El lector toca un botón para revelarla</p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Phase: label selection */}
              {popover.phase === 'label' && (
                <>
                  <p className="text-xs text-[#9A8A7A] mb-3">El lector verá este texto como botón para revelar la escena.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(popover.mediaType === 'image' ? IMAGE_LABELS : VIDEO_LABELS).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setPopover(popover.mediaType === 'image'
                          ? { phase: 'upload', label: l, target: (popover as any).target }
                          : { phase: 'url', label: l, target: (popover as any).target }
                        )}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#2E2420] text-xs font-medium text-[#C9A96E] hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/8 transition-all text-center"
                      >
                        {popover.mediaType === 'image' ? '✦' : '▶'} {l}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Phase: image upload */}
              {popover.phase === 'upload' && (
                <>
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-[#C9A96E]/8 border border-[#C9A96E]/20">
                    <span className="text-xs text-[#C9A96E]">✦</span>
                    <span className="text-sm font-display font-medium text-[#C9A96E]">{popover.label}</span>
                  </div>
                  <label className={`flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${uploading ? 'border-primary/40 bg-primary/5' : 'border-[#2E2420] hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/5'}`}>
                    {uploading
                      ? <><Loader2 size={20} className="animate-spin text-[#C9A96E]" /><span className="text-xs text-[#9A8A7A]">Subiendo imagen…</span></>
                      : <><ImageIcon size={20} className="text-[#C9A96E]/60" /><span className="text-xs text-[#9A8A7A]">Toca para elegir imagen</span><span className="text-[10px] text-[#9A8A7A]/60">JPG, PNG, WebP — máx. 5 MB</span></>
                    }
                    <input ref={revealFileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRevealUpload(f); e.target.value = ''; }} />
                  </label>
                  <button type="button" onClick={() => setPopover({ phase: 'label', mediaType: 'image', target: (popover as any).target })}
                    className="mt-3 text-xs text-[#9A8A7A] hover:text-[#F5EFE6] transition-colors">
                    ← Cambiar texto del botón
                  </button>
                </>
              )}

              {/* Phase: video URL */}
              {popover.phase === 'url' && (
                <>
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-[#C9A96E]/8 border border-[#C9A96E]/20">
                    <span className="text-xs text-[#C9A96E]">▶</span>
                    <span className="text-sm font-display font-medium text-[#C9A96E]">{popover.label}</span>
                  </div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRevealVideoInsert(); } }}
                    placeholder="YouTube, Vimeo o enlace directo…"
                    className="w-full bg-[#0D0B0A] border border-[#2E2420] rounded-xl px-3 py-2.5 text-sm text-[#F5EFE6] placeholder-[#9A8A7A]/50 outline-none focus:border-[#C9A96E]/40 transition-colors"
                    autoFocus
                  />
                  <label className={`mt-3 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-dashed cursor-pointer transition-all ${uploading ? 'border-primary/40 bg-primary/5' : 'border-[#2E2420] hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/5'}`}>
                    {uploading
                      ? <><Loader2 size={18} className="animate-spin text-[#C9A96E]" /><span className="text-xs text-[#9A8A7A]">Subiendo video…</span></>
                      : <><Play size={18} className="text-[#C9A96E]/60" /><span className="text-xs text-[#9A8A7A]">Subir video desde dispositivo</span><span className="text-[10px] text-[#9A8A7A]/60">MP4, WebM o MOV</span></>
                    }
                    <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRevealVideoUpload(f); e.target.value = ''; }} />
                  </label>
                  <button
                    type="button"
                    onClick={handleRevealVideoInsert}
                    disabled={!videoUrl.trim()}
                    className="mt-3 w-full py-2.5 text-sm font-semibold bg-primary text-noir rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-all"
                  >
                    Insertar escena
                  </button>
                  <button type="button" onClick={() => setPopover({ phase: 'label', mediaType: 'video', target: (popover as any).target })}
                    className="mt-2 text-xs text-[#9A8A7A] hover:text-[#F5EFE6] transition-colors">
                    ← Cambiar texto del botón
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .prose-chapter p { margin: 0.75rem 0; }
        .prose-chapter h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: #c9a96e; margin: 1.5rem 0 0.75rem; }
        .prose-chapter h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; color: #c9a96e; margin: 1.25rem 0 0.5rem; }
        .prose-chapter h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: #d4a0b0; margin: 1rem 0 0.5rem; }
        .prose-chapter blockquote { border-left: 3px solid #c9a96e; padding-left: 1.25rem; margin: 1.25rem 0; color: #a89080; font-style: italic; }
        .prose-chapter ul { list-style: disc; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-chapter ol { list-style: decimal; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-chapter li { margin: 0.35rem 0; }
        .prose-chapter hr { border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 2rem 0; }
        .prose-chapter strong { color: #f0e6d3; font-weight: 700; }
        .prose-chapter em { color: #d4a0b0; }
        .ch-figure { margin: 1.5rem 0; border-radius: 0.75rem; overflow: hidden; }
        .ch-figure img { width: 100%; display: block; }
        .ch-figcaption { font-size: 0.8rem; color: #9A8A7A; text-align: center; padding: 0.4rem 0.75rem; font-style: italic; min-height: 1.5rem; }
        .ch-figcaption:empty::before { content: attr(data-placeholder); opacity: 0.4; pointer-events: none; }
        .ch-reveal-block, .ch-media-block {
          display: block;
          width: min(100%, 420px);
          margin: 1.5rem auto;
          padding: 0.65rem;
          border: 1px solid rgba(201,169,110,0.3);
          border-radius: 0.9rem;
          color: #C9A96E;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-align: center;
          user-select: none;
          background: rgba(201,169,110,0.04);
          font-family: var(--font-display, serif);
          position: relative;
        }
        .ch-reveal-block::before, .ch-media-block::before {
          content: '✦ ';
          opacity: 0.5;
          font-size: 0.6rem;
        }
        .ch-editor-media-preview {
          margin-top: 0.65rem;
          overflow: hidden;
          border-radius: 0.65rem;
          border: 1px solid rgba(201,169,110,0.22);
          background: rgba(13,11,10,0.72);
          color: #9A8A7A;
          letter-spacing: 0;
          font-family: var(--font-sans, sans-serif);
          font-size: 0.68rem;
          line-height: 1.35;
        }
        .ch-editor-media-preview img,
        .ch-editor-media-preview video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          background: #0D0B0A;
        }
        .ch-editor-media-meta {
          padding: 0.55rem 0.7rem;
          overflow-wrap: anywhere;
          text-align: left;
          color: #9A8A7A;
        }
      `}</style>
    </div>
  );
}
