-- Repair mixed Spanish/English relato fields after reviewing diagnostics.
-- Run manually in Supabase SQL editor. This does not create tables or delete data.

create or replace function public.slugify_relato_title(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(
      coalesce(value, 'relato'),
      'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
      'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC'
    )),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

update public.relatos
set
  slug = coalesce(nullif(slug, ''), public.slugify_relato_title(coalesce(nullif(titulo, ''), nullif(title, '')))),
  title = coalesce(nullif(title, ''), nullif(titulo, '')),
  titulo = coalesce(nullif(titulo, ''), nullif(title, '')),
  excerpt = coalesce(nullif(excerpt, ''), nullif(resumen, ''), nullif(extracto, '')),
  resumen = coalesce(nullif(resumen, ''), nullif(excerpt, ''), nullif(extracto, '')),
  extracto = coalesce(nullif(extracto, ''), nullif(resumen, ''), nullif(excerpt, '')),
  content = coalesce(nullif(content, ''), nullif(cuerpo, '')),
  cuerpo = coalesce(nullif(cuerpo, ''), nullif(content, '')),
  cover_image_url = coalesce(nullif(cover_image_url, ''), nullif(portada_url, ''), nullif(imagen_url, '')),
  portada_url = coalesce(nullif(portada_url, ''), nullif(cover_image_url, ''), nullif(imagen_url, '')),
  imagen_url = coalesce(nullif(imagen_url, ''), nullif(cover_image_url, ''), nullif(portada_url, ''), ''),
  status = case
    when estado::text in ('publicado', 'published') or published is true then 'published'
    when estado::text in ('revision', 'en_revision', 'en revisión') then 'revision'
    when estado::text in ('archivado', 'archived') then 'archived'
    when status is null or status = '' then 'draft'
    else status
  end,
  estado = case
    when estado::text in ('publicado', 'published') or published is true then 'publicado'
    when estado::text in ('revision', 'en_revision', 'en revisión') then 'revision'
    when estado::text in ('archivado', 'archived') then 'archivado'
    when estado is null or estado = '' then 'borrador'
    else estado
  end,
  published = case
    when estado::text in ('publicado', 'published') or status = 'published' or published is true then true
    else false
  end;
