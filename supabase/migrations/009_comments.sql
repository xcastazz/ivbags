-- Comentarios de clientas con fotos y moderación.
-- Un comentario de solo texto y sin señales raras se publica de una vez.
-- Si trae fotos, enlaces, groserías o parece spam, queda "en revisión" hasta que el taller lo apruebe.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 60),
  body text not null check (char_length(body) between 3 and 800),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_reason text,
  created_at timestamptz not null default now()
);
create index if not exists comments_status_created_idx on public.comments (status, created_at desc);

alter table public.comments enable row level security;
drop policy if exists "Anyone reads approved comments" on public.comments;
create policy "Anyone reads approved comments" on public.comments for select using (status = 'approved' or user_id = auth.uid() or public.has_admin_role());
drop policy if exists "Customers write own comments" on public.comments;
create policy "Customers write own comments" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Customers delete own comments" on public.comments;
create policy "Customers delete own comments" on public.comments for delete using (user_id = auth.uid() or public.has_admin_role());
drop policy if exists "Admins moderate comments" on public.comments;
create policy "Admins moderate comments" on public.comments for update using (public.has_admin_role()) with check (public.has_admin_role());

-- Moderación automática: decide el estado; la clienta nunca puede autopublicarse.
create or replace function public.moderate_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  txt text := lower(new.body);
  reason text;
  recent int;
begin
  new.user_id := auth.uid();
  new.body := btrim(regexp_replace(new.body, '\s{3,}', E'\n\n', 'g'));
  new.author_name := btrim(new.author_name);
  new.created_at := now();

  -- Máximo 3 comentarios por día por persona.
  select count(*) into recent from public.comments where user_id = new.user_id and created_at > now() - interval '1 day';
  if recent >= 3 then
    raise exception 'Ya dejaste varios comentarios hoy. Vuelve mañana.';
  end if;

  -- Las fotos solo pueden venir de la carpeta de la propia clienta en nuestro almacenamiento.
  if exists (select 1 from unnest(new.photos) p where p !~ ('/storage/v1/object/public/comments/' || new.user_id::text || '/')) then
    raise exception 'Foto no válida';
  end if;

  if txt ~ '(https?://|www\.|\.com\b|\.co\b|@[a-z0-9_]{3,})' then
    reason := 'Tiene enlaces o menciones';
  elsif txt ~ '\m(hp|hpta|hijueputa|hijo de puta|puta|puto|malparid[oa]|gonorrea|careverga|verga|mierda|marica|perra|zorra|idiota|estupid[oa]|imbecil|imbécil|pendej[oa]|culo|chimba|sapo|fuck|shit|bitch)\M' then
    reason := 'Lenguaje ofensivo';
  elsif txt ~ '(\d[\s.-]?){7,}' then
    reason := 'Tiene números de teléfono';
  elsif txt ~ '(.)\1{6,}' or (char_length(regexp_replace(new.body, '[^A-ZÁÉÍÓÚÑ]', '', 'g')) > 20 and new.body = upper(new.body)) then
    reason := 'Parece spam';
  elsif cardinality(new.photos) > 0 then
    reason := 'Trae fotos';
  end if;

  if reason is null then
    new.status := 'approved';
    new.review_reason := null;
  else
    new.status := 'pending';
    new.review_reason := reason;
  end if;
  return new;
end;
$$;
drop trigger if exists comments_moderate on public.comments;
create trigger comments_moderate before insert on public.comments for each row execute procedure public.moderate_comment();

-- Aviso al panel.
alter table public.admin_notifications drop constraint if exists admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check
  check (kind in ('order', 'payment', 'payment_failed', 'custom_request', 'message', 'customer', 'comment'));

create or replace function public.notify_new_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin('comment',
    case when new.status = 'pending' then 'Comentario por revisar · ' || new.review_reason else 'Nuevo comentario publicado' end,
    new.author_name || ': ' || left(new.body, 120), '/admin/comentarios');
  return new;
end;
$$;
drop trigger if exists admin_notify_comment on public.comments;
create trigger admin_notify_comment after insert on public.comments for each row execute procedure public.notify_new_comment();

-- Fotos: cada clienta sube solo a su carpeta, máximo 5 MB, solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comments', 'comments', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public reads comment photos" on storage.objects;
create policy "Public reads comment photos" on storage.objects for select using (bucket_id = 'comments');
drop policy if exists "Customers upload comment photos" on storage.objects;
create policy "Customers upload comment photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'comments' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Owners and admins delete comment photos" on storage.objects;
create policy "Owners and admins delete comment photos" on storage.objects for delete
  using (bucket_id = 'comments' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_admin_role()));
