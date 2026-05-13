-- ============================================================
-- SoloLatinas: Historia Capitulos RLS & Slug support
-- ============================================================
-- historia_capitulos and capitulo_media_blocks already exist
-- with columns: historia_id, cuerpo_html, position (not relato_id, cuerpo, posicion)
-- This migration only:
--   1. Adds slug to relatos (safe with IF NOT EXISTS)
--   2. Fixes RLS policies to use the real column names

-- 1. Add slug to relatos (for /historia/[slug] routes)
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_relatos_slug ON public.relatos(slug) WHERE slug IS NOT NULL;

-- Auto-generate slug from titulo on insert if not provided
CREATE OR REPLACE FUNCTION public.generate_relato_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(unaccent(NEW.titulo)),
      '[^a-z0-9]+', '-', 'g'
    );
    NEW.slug := rtrim(NEW.slug, '-') || '-' || left(replace(NEW.id::text, '-', ''), 8);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_relato_slug ON public.relatos;
CREATE TRIGGER set_relato_slug
  BEFORE INSERT ON public.relatos
  FOR EACH ROW EXECUTE FUNCTION public.generate_relato_slug();

-- Backfill slugs for existing relatos that don't have one
UPDATE public.relatos
SET slug = rtrim(
    regexp_replace(lower(titulo), '[^a-z0-9]+', '-', 'g'),
    '-'
  ) || '-' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL OR slug = '';

-- 2. RLS for historia_capitulos (real FK column is historia_id)
ALTER TABLE public.historia_capitulos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitulo_media_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_capitulos" ON public.historia_capitulos;
CREATE POLICY "public_read_capitulos" ON public.historia_capitulos
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id AND r.estado IN ('publicado', 'destacado')
    )
  );

DROP POLICY IF EXISTS "author_manage_capitulos" ON public.historia_capitulos;
CREATE POLICY "author_manage_capitulos" ON public.historia_capitulos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = historia_id AND r.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_read_media_blocks" ON public.capitulo_media_blocks;
CREATE POLICY "public_read_media_blocks" ON public.capitulo_media_blocks
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id AND r.estado IN ('publicado', 'destacado')
    )
  );

DROP POLICY IF EXISTS "author_manage_media_blocks" ON public.capitulo_media_blocks;
CREATE POLICY "author_manage_media_blocks" ON public.capitulo_media_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.historia_id
      WHERE hc.id = capitulo_id AND r.autor_id = auth.uid()
    )
  );
