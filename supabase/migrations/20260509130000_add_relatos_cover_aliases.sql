alter table public.relatos
  add column if not exists portada_url text default '',
  add column if not exists cover_image_url text default '';

notify pgrst, 'reload schema';
