-- ============================================================
-- SoloLatinas: Fix RLS for historia_capitulos & capitulo_media_blocks
-- ============================================================
-- Run this directly in the Supabase SQL Editor.
-- Fully idempotent: drops and recreates all policies.
--
-- Ownership check uses relatos.autor_id (the only author FK column).
-- ============================================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE public.historia_capitulos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitulo_media_blocks ENABLE ROW LEVEL SECURITY;

-- ── historia_capitulos ─────────────────────────────────────────────────────────

-- Drop all existing policies first (idempotent)
DROP POLICY IF EXISTS "public_read_capitulos"   ON public.historia_capitulos;
DROP POLICY IF EXISTS "author_manage_capitulos" ON public.historia_capitulos;
DROP POLICY IF EXISTS "author_select_capitulos" ON public.historia_capitulos;
DROP POLICY IF EXISTS "author_insert_capitulos" ON public.historia_capitulos;
DROP POLICY IF EXISTS "author_update_capitulos" ON public.historia_capitulos;
DROP POLICY IF EXISTS "author_delete_capitulos" ON public.historia_capitulos;

-- Public can read chapters of published / featured stories
CREATE POLICY "public_read_capitulos" ON public.historia_capitulos
  FOR SELECT TO public
  USING (
    estado = 'publicado'
    AND EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.estado IN ('publicado', 'destacado')
    )
  );

-- Author: SELECT their own chapters (needed for INSERT ... RETURNING *)
CREATE POLICY "author_select_capitulos" ON public.historia_capitulos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: INSERT chapters into their own stories
CREATE POLICY "author_insert_capitulos" ON public.historia_capitulos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: UPDATE their own chapters
CREATE POLICY "author_update_capitulos" ON public.historia_capitulos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: DELETE their own chapters
CREATE POLICY "author_delete_capitulos" ON public.historia_capitulos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id
        AND r.autor_id = auth.uid()
    )
  );

-- ── capitulo_media_blocks ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_media_blocks"    ON public.capitulo_media_blocks;
DROP POLICY IF EXISTS "author_manage_media_blocks"  ON public.capitulo_media_blocks;
DROP POLICY IF EXISTS "author_select_media_blocks"  ON public.capitulo_media_blocks;
DROP POLICY IF EXISTS "author_insert_media_blocks"  ON public.capitulo_media_blocks;
DROP POLICY IF EXISTS "author_update_media_blocks"  ON public.capitulo_media_blocks;
DROP POLICY IF EXISTS "author_delete_media_blocks"  ON public.capitulo_media_blocks;

-- Public can read media blocks of visible chapters
CREATE POLICY "public_read_media_blocks" ON public.capitulo_media_blocks
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND hc.estado = 'publicado'
        AND r.estado IN ('publicado', 'destacado')
    )
  );

-- Author: SELECT media blocks of their chapters
CREATE POLICY "author_select_media_blocks" ON public.capitulo_media_blocks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: INSERT media blocks into their chapters
CREATE POLICY "author_insert_media_blocks" ON public.capitulo_media_blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: UPDATE their media blocks
CREATE POLICY "author_update_media_blocks" ON public.capitulo_media_blocks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND r.autor_id = auth.uid()
    )
  );

-- Author: DELETE their media blocks
CREATE POLICY "author_delete_media_blocks" ON public.capitulo_media_blocks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id
        AND r.autor_id = auth.uid()
    )
  );
