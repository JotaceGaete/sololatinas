'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Eye, Image as ImageIcon, Loader2, Play, X } from 'lucide-react';
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

export default function ChapterRichEditor({ value, onChange, placeholder, userId, minHeight = 500 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const revealFileRef = useRef<HTMLInputElement>(null);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [uploadingReveal, setUploadingReveal] = useState(false);
  // Reveal image config bar
  const [showRevealImage, setShowRevealImage] = useState(false);
  const [revealImageLabel, setRevealImageLabel] = useState(IMAGE_LABELS[0]);
  // Reveal video config bar
  const [showRevealVideo, setShowRevealVideo] = useState(false);
  const [revealVideoLabel, setRevealVideoLabel] = useState(VIDEO_LABELS[0]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const notify = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    notify();
  }, [notify]);

  const captureRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
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

  // Direct DOM insertion — execCommand('insertHTML') strips data-* attributes
  const insertRevealBlock = useCallback((type: 'image' | 'video', url: string, label: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const block = document.createElement('div');
    block.className = 'ch-reveal-block';
    block.setAttribute('data-media-type', type);
    block.setAttribute('data-media-url', url);
    block.setAttribute('contenteditable', 'false');
    block.textContent = label;

    const gap = document.createElement('p');
    gap.appendChild(document.createElement('br'));

    // Insert after the block-level ancestor that contains the cursor
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

    // Move cursor into the gap paragraph
    const newRange = document.createRange();
    newRange.setStart(gap, 0);
    newRange.collapse(true);
    if (sel) { sel.removeAllRanges(); sel.addRange(newRange); }

    console.log('[ChapterRichEditor] insertRevealBlock: has data-media-type:', editor.querySelector('[data-media-type]') !== null);
    notify();
  }, [notify]);

  // ── Inline image upload ────────────────────────────────────────────────────────
  const handleInlineImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingInline(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('userId', userId);
      body.append('folder', 'chapter_images');
      const res = await fetch('/api/r2/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { publicUrl } = await res.json();
      insertHtmlAtSaved(
        `<figure class="ch-figure"><img src="${publicUrl}" alt="" /><figcaption class="ch-figcaption" data-placeholder="Descripción (opcional)"></figcaption></figure><p></p>`
      );
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + (err?.message ?? 'Verifica la configuración de R2'));
    } finally {
      setUploadingInline(false);
    }
  }, [userId, insertHtmlAtSaved]);

  // ── Reveal image upload ────────────────────────────────────────────────────────
  const handleRevealImageFile = useCallback(async (file: File, label: string) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingReveal(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('userId', userId);
      body.append('folder', 'chapter_images');
      const res = await fetch('/api/r2/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { publicUrl } = await res.json();
      insertRevealBlock('image', publicUrl, label);
      setShowRevealImage(false);
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + (err?.message ?? 'Verifica la configuración de R2'));
    } finally {
      setUploadingReveal(false);
    }
  }, [userId, insertRevealBlock]);

  const handleInsertVideo = useCallback(() => {
    const url = videoUrl.trim();
    if (!url) return;
    insertRevealBlock('video', url, revealVideoLabel);
    setVideoUrl('');
    setShowRevealVideo(false);
  }, [videoUrl, revealVideoLabel, insertRevealBlock]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleInlineImageFile(file);
  }, [handleInlineImageFile]);

  const closeAllBars = () => { setShowRevealImage(false); setShowRevealVideo(false); };

  const isEmpty = !value || value === '<br>' || value === '';

  return (
    <div
      className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface focus-within:border-primary/60 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-noir/60 sticky top-0 z-10">
        <select
          onChange={(e) => { editorRef.current?.focus(); document.execCommand('formatBlock', false, e.target.value); notify(); }}
          className="bg-surface border border-border text-foreground text-xs rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:border-primary/60"
          defaultValue="p"
        >
          {HEADING_OPTIONS.map((h) => (
            <option key={h.tag} value={h.tag}>{h.label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); execCmd(btn.cmd); }}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors ${btn.style}`}
          >
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
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-lg leading-none">
          "
        </button>
        <button type="button" title="Separador" onMouseDown={(e) => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* ── Imagen visible (inline) ── */}
        <button
          type="button"
          title="Imagen visible: aparece directamente en el texto"
          onMouseDown={(e) => { e.preventDefault(); captureRange(); closeAllBars(); inlineFileRef.current?.click(); }}
          disabled={uploadingInline || uploadingReveal}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium text-muted-foreground bg-white/5 hover:bg-white/10 border border-border transition-colors disabled:opacity-50"
        >
          {uploadingInline
            ? <><Loader2 size={12} className="animate-spin" /> Subiendo…</>
            : <><ImageIcon size={12} /> Imagen visible</>
          }
        </button>
        <input ref={inlineFileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInlineImageFile(f); e.target.value = ''; }} />

        {/* ── Revelar imagen ── */}
        <button
          type="button"
          title="Revelar imagen: el lector toca para ver la imagen en modal"
          onMouseDown={(e) => {
            e.preventDefault();
            captureRange();
            setShowRevealVideo(false);
            setShowRevealImage((v) => !v);
          }}
          disabled={uploadingInline || uploadingReveal}
          className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 ${
            showRevealImage
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
          }`}
        >
          <Eye size={12} /> Revelar imagen
        </button>

        {/* ── Revelar video ── */}
        <button
          type="button"
          title="Revelar video: el lector toca para ver el video en modal"
          onMouseDown={(e) => {
            e.preventDefault();
            captureRange();
            setShowRevealImage(false);
            setShowRevealVideo((v) => !v);
          }}
          className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border transition-colors ${
            showRevealVideo
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
          }`}
        >
          <Play size={12} /> Revelar video
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button type="button" title="Limpiar formato" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>
          </svg>
        </button>
      </div>

      {/* ── Revelar imagen config bar ── */}
      {showRevealImage && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-primary/5">
          <Eye size={12} className="text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground flex-shrink-0">Texto del botón:</span>
          <select
            value={revealImageLabel}
            onChange={(e) => setRevealImageLabel(e.target.value)}
            className="bg-surface border border-border text-foreground text-xs rounded-md px-2 py-1 focus:outline-none focus:border-primary/60"
          >
            {IMAGE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <label
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary text-noir rounded-md cursor-pointer transition-all ${uploadingReveal ? 'opacity-50 pointer-events-none' : 'hover:bg-primary/90'}`}
          >
            {uploadingReveal ? <><Loader2 size={11} className="animate-spin" /> Subiendo…</> : 'Subir imagen'}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRevealImageFile(f, revealImageLabel); e.target.value = ''; }} />
          </label>
          <button type="button" onClick={() => setShowRevealImage(false)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Revelar video config bar ── */}
      {showRevealVideo && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-primary/5">
          <Play size={12} className="text-primary flex-shrink-0" />
          <select
            value={revealVideoLabel}
            onChange={(e) => setRevealVideoLabel(e.target.value)}
            className="bg-surface border border-border text-foreground text-xs rounded-md px-2 py-1 focus:outline-none focus:border-primary/60 flex-shrink-0"
          >
            {VIDEO_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleInsertVideo(); }
              if (e.key === 'Escape') { setShowRevealVideo(false); setVideoUrl(''); }
            }}
            placeholder="Pega URL de YouTube, Vimeo o video directo…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground/50 outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleInsertVideo}
            disabled={!videoUrl.trim()}
            className="px-2.5 py-1 text-xs font-medium bg-primary text-noir rounded-md disabled:opacity-40 transition-all"
          >
            Insertar
          </button>
          <button type="button" onClick={() => { setShowRevealVideo(false); setVideoUrl(''); }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="relative" style={{ minHeight }}>
        {isEmpty && (
          <div
            className="absolute top-6 left-6 text-muted-foreground/40 pointer-events-none font-serif text-lg select-none"
            style={{ lineHeight: '1.9' }}
          >
            {placeholder || 'Escribe el contenido del capítulo...'}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={notify}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
            }
          }}
          className="p-6 text-foreground font-serif text-lg leading-relaxed focus:outline-none prose-chapter"
          style={{ minHeight, lineHeight: '1.9' }}
        />
      </div>

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
          width: fit-content;
          margin: 1.25rem auto;
          padding: 0.45rem 1.5rem;
          border: 1px solid rgba(201,169,110,0.35);
          border-radius: 999px;
          color: #C9A96E;
          font-size: 0.78rem;
          letter-spacing: 0.07em;
          text-align: center;
          cursor: default;
          user-select: none;
          background: rgba(201,169,110,0.05);
          font-family: var(--font-display, sans-serif);
        }
      `}</style>
    </div>
  );
}
