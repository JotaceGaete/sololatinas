-- ============================================================
-- SoloLatinas: Align historia_capitulos FK to relatos
-- ============================================================
-- historia_capitulos.historia_id currently references historias(id).
-- The active content table is relatos(id).
-- This migration drops the old FK and adds the correct one.
-- Safe to run even if the FK name differs — uses DO block to find
-- and drop by column rather than by name.
-- ============================================================

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  -- Find the current FK constraint on historia_capitulos.historia_id
  SELECT tc.constraint_name
    INTO fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_schema    = 'public'
     AND tc.table_name      = 'historia_capitulos'
     AND kcu.column_name    = 'historia_id'
   LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.historia_capitulos DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- Add correct FK pointing to relatos(id)
ALTER TABLE public.historia_capitulos
  ADD CONSTRAINT historia_capitulos_historia_id_fkey
  FOREIGN KEY (historia_id)
  REFERENCES public.relatos(id)
  ON DELETE CASCADE;

-- Index to support the FK lookup (safe if already exists)
CREATE INDEX IF NOT EXISTS idx_historia_capitulos_historia_id
  ON public.historia_capitulos(historia_id);
