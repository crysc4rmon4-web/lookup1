-- Aplicar antes de desplegar la compatibilidad con vídeos de iPhone.
-- Amplía únicamente formatos; conserva tamaño, acceso público y políticas existentes.
begin;
update storage.buckets
set allowed_mime_types = case when allowed_mime_types is null then null else
  array(select distinct unnest(allowed_mime_types || array[
    'video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp', 'video/ogg'
  ])) end
where id = 'event-images';
commit;
