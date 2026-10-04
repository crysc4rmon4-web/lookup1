-- Contrastado con el esquema facilitado el 04/10/2026. No ejecutar automáticamente.
-- Aplicar antes de desplegar el código, con aprobación del propietario.
begin;

create table public.event_likes (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index event_likes_profile_idx on public.event_likes(profile_id);
alter table public.event_likes enable row level security;
-- Solo el backend: valida la sesión, visibilidad y propiedad antes de operar.
revoke all on public.event_likes from anon, authenticated;
grant select, insert, delete on public.event_likes to service_role;

create function public.event_like_summaries(event_ids uuid[], viewer_id uuid)
returns table(event_id uuid, like_count bigint, is_liked boolean)
language sql stable security invoker set search_path = '' as $$
  select ids.id, count(l.profile_id), coalesce(bool_or(l.profile_id = viewer_id), false)
  from unnest(event_ids) as ids(id)
  left join public.event_likes l on l.event_id = ids.id
  group by ids.id;
$$;
revoke all on function public.event_like_summaries(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.event_like_summaries(uuid[], uuid) to service_role;

-- Guardado transaccional: un fallo conserva la galería y portada anteriores.
create function public.replace_event_media(target_id uuid, owner_id uuid, media jsonb)
returns setof public.event_images
language plpgsql security invoker set search_path = '' as $$
declare target public.events; first_path text;
begin
  select * into target from public.events where id = target_id and creator_profile_id = owner_id for update;
  if not found then raise exception 'Evento no disponible'; end if;
  if target.status not in ('draft', 'published') or (target.status = 'published' and target.start_at <= now()) then
    raise exception 'Este evento ya no admite cambios de archivos';
  end if;
  if media is null or jsonb_typeof(media) <> 'array' or jsonb_array_length(media) > 5 then raise exception 'Galería no válida'; end if;
  if target.status = 'published' and jsonb_array_length(media) = 0 then raise exception 'La portada es obligatoria'; end if;
  select item->>'storagePath' into first_path from jsonb_array_elements(media) item order by (item->>'position')::int limit 1;
  if first_path is not null and first_path !~* '\.(jpg|jpeg|png|webp)$' then raise exception 'La portada debe ser una foto'; end if;
  if exists(select 1 from jsonb_array_elements(media) item where
    item->>'storagePath' not like owner_id::text || '/' || target_id::text || '/%' or
    item->>'storagePath' like '%..%') then raise exception 'Archivo no válido'; end if;
  delete from public.event_images where event_id = target_id;
  insert into public.event_images(event_id, storage_path, position)
    select target_id, item->>'storagePath', (item->>'position')::smallint from jsonb_array_elements(media) item;
  -- URL preparada por el servidor tras verificar Storage; se actualiza en la misma transacción.
  update public.events set cover_image_url = (
    select item->>'publicUrl' from jsonb_array_elements(media) item order by (item->>'position')::int limit 1
  ), updated_at = now() where id = target_id;
  return query select * from public.event_images where event_id = target_id order by position;
end;
$$;
revoke all on function public.replace_event_media(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_event_media(uuid, uuid, jsonb) to service_role;

-- No cambia políticas ni hace público un bucket privado.
update storage.buckets
set file_size_limit = greatest(coalesce(file_size_limit, 0), 52428800),
    allowed_mime_types = case when allowed_mime_types is null then null else
      array(select distinct unnest(allowed_mime_types || array['video/mp4', 'video/webm'])) end
where id = 'event-images';

commit;
