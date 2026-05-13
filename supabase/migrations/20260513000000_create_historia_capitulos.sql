-- ============================================================
-- SoloLatinas: Historia Capitulos & Media Blocks
-- ============================================================
-- Adds chapter support to existing relatos.
-- A relato with chapters = multi-part historia.
-- A relato without chapters = single story (existing behavior unchanged).

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
    -- Append short id segment to guarantee uniqueness
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

-- 2. Historia capitulos
CREATE TABLE IF NOT EXISTS public.historia_capitulos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  relato_id     UUID        NOT NULL REFERENCES public.relatos(id) ON DELETE CASCADE,
  numero        INTEGER     NOT NULL,
  titulo        TEXT        NOT NULL DEFAULT '',
  cuerpo        TEXT        NOT NULL DEFAULT '',
  extracto      TEXT        NOT NULL DEFAULT '',
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(relato_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_capitulos_relato_id ON public.historia_capitulos(relato_id);
CREATE INDEX IF NOT EXISTS idx_capitulos_numero    ON public.historia_capitulos(relato_id, numero);

-- 3. Capitulo media blocks (images / videos per chapter)
CREATE TABLE IF NOT EXISTS public.capitulo_media_blocks (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id UUID    NOT NULL REFERENCES public.historia_capitulos(id) ON DELETE CASCADE,
  tipo        TEXT    NOT NULL DEFAULT 'imagen',   -- 'imagen' | 'video' | 'audio' | 'separador'
  url         TEXT    NOT NULL DEFAULT '',
  alt         TEXT    NOT NULL DEFAULT '',
  caption     TEXT    NOT NULL DEFAULT '',
  posicion    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_blocks_capitulo ON public.capitulo_media_blocks(capitulo_id, posicion);

-- 4. updated_at trigger for capitulos
DROP TRIGGER IF EXISTS update_capitulos_updated_at ON public.historia_capitulos;
CREATE TRIGGER update_capitulos_updated_at
  BEFORE UPDATE ON public.historia_capitulos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS
ALTER TABLE public.historia_capitulos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitulo_media_blocks ENABLE ROW LEVEL SECURITY;

-- Public can read chapters of published relatos
DROP POLICY IF EXISTS "public_read_capitulos" ON public.historia_capitulos;
CREATE POLICY "public_read_capitulos" ON public.historia_capitulos
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = relato_id AND r.estado IN ('publicado', 'destacado')
    )
  );

-- Authors can manage their own chapters
DROP POLICY IF EXISTS "author_manage_capitulos" ON public.historia_capitulos;
CREATE POLICY "author_manage_capitulos" ON public.historia_capitulos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = relato_id AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.relatos r
      WHERE r.id = relato_id AND r.autor_id = auth.uid()
    )
  );

-- Public can read media blocks of visible chapters
DROP POLICY IF EXISTS "public_read_media_blocks" ON public.capitulo_media_blocks;
CREATE POLICY "public_read_media_blocks" ON public.capitulo_media_blocks
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.relato_id
      WHERE hc.id = capitulo_id AND r.estado IN ('publicado', 'destacado')
    )
  );

-- Authors manage media blocks of their chapters
DROP POLICY IF EXISTS "author_manage_media_blocks" ON public.capitulo_media_blocks;
CREATE POLICY "author_manage_media_blocks" ON public.capitulo_media_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.relato_id
      WHERE hc.id = capitulo_id AND r.autor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos hc
        JOIN public.relatos r ON r.id = hc.relato_id
      WHERE hc.id = capitulo_id AND r.autor_id = auth.uid()
    )
  );
