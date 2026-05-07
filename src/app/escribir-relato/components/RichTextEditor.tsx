'use client';

import React, { useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', icon: 'B', title: 'Negrita (Ctrl+B)', style: 'font-bold' },
  { cmd: 'italic', icon: 'I', title: 'Cursiva (Ctrl+I)', style: 'italic' },
  { cmd: 'underline', icon: 'U', title: 'Subrayado (Ctrl+U)', style: 'underline' },
  { cmd: 'strikeThrough', icon: 'S̶', title: 'Tachado', style: 'line-through' },
];

const HEADING_OPTIONS = [
  { label: 'Párrafo', tag: 'p' },
  { label: 'Título 1', tag: 'h1' },
  { label: 'Título 2', tag: 'h2' },
  { label: 'Título 3', tag: 'h3' },
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const execCmd = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleHeading = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, []);

  const isEmpty = !value || value === '<br>' || value === '';

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface focus-within:border-primary/60 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-noir/60 sticky top-0 z-10">
        {/* Heading selector */}
        <select
          onChange={(e) => handleHeading(e.target.value)}
          className="bg-surface border border-border text-foreground text-xs rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:border-primary/60 mr-1"
          defaultValue="p"
        >
          {HEADING_OPTIONS.map((h) => (
            <option key={h.tag} value={h.tag}>{h.label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Format buttons */}
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

        {/* Lists */}
        <button
          type="button"
          title="Lista con viñetas"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button
          type="button"
          title="Lista numerada"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/>
            <path d="M6 14H4c0-1 2-2 2-3s-1-1-2-1" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <button
          type="button"
          title="Alinear izquierda"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </button>
        <button
          type="button"
          title="Centrar"
          onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Quote */}
        <button
          type="button"
          title="Cita"
          onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-lg leading-none"
        >
          "
        </button>

        {/* Separator */}
        <button
          type="button"
          title="Línea separadora"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Clear formatting */}
        <button
          type="button"
          title="Limpiar formato"
          onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
          </svg>
        </button>
      </div>

      {/* Editor area */}
      <div className="relative min-h-[400px] md:min-h-[500px]">
        {isEmpty && (
          <div className="absolute top-6 left-6 text-muted-foreground/40 pointer-events-none font-serif text-lg select-none">
            {placeholder || 'Comienza a escribir tu relato aquí...'}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[400px] md:min-h-[500px] p-6 text-foreground font-serif text-lg leading-relaxed focus:outline-none prose-editor"
          style={{ lineHeight: '1.9' }}
        />
      </div>

      <style jsx global>{`
        .prose-editor h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: #c9a96e; margin: 1.5rem 0 0.75rem; }
        .prose-editor h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; color: #c9a96e; margin: 1.25rem 0 0.5rem; }
        .prose-editor h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: #d4a0b0; margin: 1rem 0 0.5rem; }
        .prose-editor p { margin: 0.75rem 0; }
        .prose-editor blockquote { border-left: 3px solid #c9a96e; padding-left: 1.25rem; margin: 1.25rem 0; color: #a89080; font-style: italic; }
        .prose-editor ul { list-style: disc; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-editor li { margin: 0.35rem 0; }
        .prose-editor hr { border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 2rem 0; }
        .prose-editor strong { color: #f0e6d3; font-weight: 700; }
        .prose-editor em { color: #d4a0b0; }
      `}</style>
    </div>
  );
}
