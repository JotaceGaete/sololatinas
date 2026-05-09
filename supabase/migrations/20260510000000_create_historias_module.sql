-- ============================================================
-- SoloLatinas: Historias (serialized stories) Module
-- ============================================================
-- Idempotente: usa IF NOT EXISTS, DROP/CREATE para políticas.
-- NO toca public.relatos ni ninguna tabla existente.
-- Requiere: public.user_profiles, public.update_updated_at_column()
-- ============================================================

-- ── 1. TABLA: historias ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.historias (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      text        NOT NULL,
  slug        text,
  descripcion text        DEFAULT '',
  portada_url text        DEFAULT '',
  autor_id    uuid        REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  estado      text        NOT NULL DEFAULT 'draft'
              CHECK (estado IN ('draft', 'revision', 'publicada', 'archivada')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_historias_slug
  ON public.historias(slug) WHERE slug IS NOT NULL AND slug <> '';

CREATE INDEX IF NOT EXISTS idx_historias_autor_id  ON public.historias(autor_id);
CREATE INDEX IF NOT EXISTS idx_historias_estado     ON public.historias(estado);
CREATE INDEX IF NOT EXISTS idx_historias_created_at ON public.historias(created_at DESC);

-- ── 2. TABLA: historia_capitulos ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.historia_capitulos (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  historia_id uuid        NOT NULL REFERENCES public.historias(id) ON DELETE CASCADE,
  numero      integer     NOT NULL,
  titulo      text        NOT NULL DEFAULT '',
  cuerpo_html text        DEFAULT '',
  estado      text        NOT NULL DEFAULT 'draft'
              CHECK (estado IN ('draft', 'revision', 'publicado', 'archivado')),
  published_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (historia_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_capitulos_historia_id ON public.historia_capitulos(historia_id);
CREATE INDEX IF NOT EXISTS idx_capitulos_numero
  ON public.historia_capitulos(historia_id, numero);

-- ── 3. TABLA: capitulo_media_blocks ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.capitulo_media_blocks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  capitulo_id uuid        NOT NULL REFERENCES public.historia_capitulos(id) ON DELETE CASCADE,
  tipo        text        NOT NULL CHECK (tipo IN ('image', 'video')),
  url         text        NOT NULL,
  caption     text        DEFAULT '',
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_blocks_capitulo_id
  ON public.capitulo_media_blocks(capitulo_id);
CREATE INDEX IF NOT EXISTS idx_media_blocks_position
  ON public.capitulo_media_blocks(capitulo_id, position);

-- ── 4. TRIGGERS (reutiliza función existente) ─────────────────────────────────

DROP TRIGGER IF EXISTS update_historias_updated_at ON public.historias;
CREATE TRIGGER update_historias_updated_at
  BEFORE UPDATE ON public.historias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_historia_capitulos_updated_at ON public.historia_capitulos;
CREATE TRIGGER update_historia_capitulos_updated_at
  BEFORE UPDATE ON public.historia_capitulos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 5. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.historias             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historia_capitulos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitulo_media_blocks ENABLE ROW LEVEL SECURITY;

-- ── historias policies ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "historias_select_public" ON public.historias;
CREATE POLICY "historias_select_public" ON public.historias
  FOR SELECT USING (estado = 'publicada');

DROP POLICY IF EXISTS "historias_select_own"    ON public.historias;
CREATE POLICY "historias_select_own" ON public.historias
  FOR SELECT USING (auth.uid() = autor_id);

DROP POLICY IF EXISTS "historias_insert_own"    ON public.historias;
CREATE POLICY "historias_insert_own" ON public.historias
  FOR INSERT WITH CHECK (auth.uid() = autor_id);

DROP POLICY IF EXISTS "historias_update_own"    ON public.historias;
CREATE POLICY "historias_update_own" ON public.historias
  FOR UPDATE USING (auth.uid() = autor_id);

DROP POLICY IF EXISTS "historias_delete_own"    ON public.historias;
CREATE POLICY "historias_delete_own" ON public.historias
  FOR DELETE USING (auth.uid() = autor_id);

-- ── historia_capitulos policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "capitulos_select_public"  ON public.historia_capitulos;
CREATE POLICY "capitulos_select_public" ON public.historia_capitulos
  FOR SELECT USING (
    estado = 'publicado'
    AND EXISTS (
      SELECT 1 FROM public.historias h
      WHERE h.id = historia_id AND h.estado = 'publicada'
    )
  );

DROP POLICY IF EXISTS "capitulos_select_own"     ON public.historia_capitulos;
CREATE POLICY "capitulos_select_own" ON public.historia_capitulos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.historias h
      WHERE h.id = historia_id AND h.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "capitulos_insert_own"     ON public.historia_capitulos;
CREATE POLICY "capitulos_insert_own" ON public.historia_capitulos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historias h
      WHERE h.id = historia_id AND h.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "capitulos_update_own"     ON public.historia_capitulos;
CREATE POLICY "capitulos_update_own" ON public.historia_capitulos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.historias h
      WHERE h.id = historia_id AND h.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "capitulos_delete_own"     ON public.historia_capitulos;
CREATE POLICY "capitulos_delete_own" ON public.historia_capitulos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.historias h
      WHERE h.id = historia_id AND h.autor_id = auth.uid()
    )
  );

-- ── capitulo_media_blocks policies ─────────────────────────────────────────
DROP POLICY IF EXISTS "media_blocks_select"     ON public.capitulo_media_blocks;
CREATE POLICY "media_blocks_select" ON public.capitulo_media_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos c
      JOIN  public.historias h ON h.id = c.historia_id
      WHERE c.id = capitulo_id
        AND (c.estado = 'publicado' OR h.autor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "media_blocks_insert_own" ON public.capitulo_media_blocks;
CREATE POLICY "media_blocks_insert_own" ON public.capitulo_media_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos c
      JOIN  public.historias h ON h.id = c.historia_id
      WHERE c.id = capitulo_id AND h.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "media_blocks_update_own" ON public.capitulo_media_blocks;
CREATE POLICY "media_blocks_update_own" ON public.capitulo_media_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos c
      JOIN  public.historias h ON h.id = c.historia_id
      WHERE c.id = capitulo_id AND h.autor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "media_blocks_delete_own" ON public.capitulo_media_blocks;
CREATE POLICY "media_blocks_delete_own" ON public.capitulo_media_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.historia_capitulos c
      JOIN  public.historias h ON h.id = c.historia_id
      WHERE c.id = capitulo_id AND h.autor_id = auth.uid()
    )
  );
