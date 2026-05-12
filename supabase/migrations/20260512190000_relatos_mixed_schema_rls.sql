-- Public reads for mixed relatos schema.
-- Supports legacy Spanish estado and newer status/published columns.

DROP POLICY IF EXISTS "public_can_read_published_relatos" ON public.relatos;
CREATE POLICY "public_can_read_published_relatos"
ON public.relatos
FOR SELECT
TO public
USING (
  published IS TRUE
  OR status = 'published'
  OR estado::text IN ('publicado', 'published')
);
