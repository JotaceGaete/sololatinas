-- Inspect the real public.relatos schema and the mixed Spanish/English fields
-- without assuming every possible column exists.

select
  ordinal_position,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'relatos'
order by ordinal_position;

select
  r.id,
  to_jsonb(r) ->> 'title' as title,
  to_jsonb(r) ->> 'titulo' as titulo,
  to_jsonb(r) ->> 'slug' as slug,
  to_jsonb(r) ->> 'excerpt' as excerpt,
  to_jsonb(r) ->> 'resumen' as resumen,
  to_jsonb(r) ->> 'extracto' as extracto,
  left(coalesce(to_jsonb(r) ->> 'content', ''), 120) as content_preview,
  left(coalesce(to_jsonb(r) ->> 'cuerpo', ''), 120) as cuerpo_preview,
  to_jsonb(r) ->> 'status' as status,
  to_jsonb(r) ->> 'estado' as estado,
  to_jsonb(r) ->> 'published' as published,
  to_jsonb(r) ->> 'destacado' as destacado,
  to_jsonb(r) ->> 'author_id' as author_id,
  to_jsonb(r) ->> 'autor_id' as autor_id,
  to_jsonb(r) ->> 'cover_image_url' as cover_image_url,
  to_jsonb(r) ->> 'portada_url' as portada_url,
  to_jsonb(r) ->> 'imagen_url' as imagen_url,
  to_jsonb(r) ->> 'lectura_minutos' as lectura_minutos,
  to_jsonb(r) ->> 'tiempo_lectura' as tiempo_lectura,
  to_jsonb(r) ->> 'published_at' as published_at,
  to_jsonb(r) ->> 'created_at' as created_at,
  to_jsonb(r) ->> 'updated_at' as updated_at
from public.relatos r
order by coalesce(r.updated_at, r.created_at) desc nulls last
limit 50;
