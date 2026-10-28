-- Videos del taller que el admin sube desde el panel y se muestran en el inicio.

create table if not exists public.store_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  video_url text not null,
  poster_url text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.store_videos enable row level security;
drop policy if exists "Anyone sees published videos" on public.store_videos;
create policy "Anyone sees published videos" on public.store_videos for select using (published or public.has_admin_role());
drop policy if exists "Admins manage videos" on public.store_videos;
create policy "Admins manage videos" on public.store_videos for all using (public.has_admin_role()) with check (public.has_admin_role());

-- Archivos de video: públicos para ver, solo el admin sube o borra. Máximo 50 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public reads videos" on storage.objects;
create policy "Public reads videos" on storage.objects for select using (bucket_id = 'videos');
drop policy if exists "Admins upload videos" on storage.objects;
create policy "Admins upload videos" on storage.objects for insert with check (bucket_id = 'videos' and public.has_admin_role());
drop policy if exists "Admins delete videos" on storage.objects;
create policy "Admins delete videos" on storage.objects for delete using (bucket_id = 'videos' and public.has_admin_role());
