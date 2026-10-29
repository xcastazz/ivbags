-- Fotos que la clienta sube al comprar un bolso personalizado (su mascota o lo que quiera estampar).
-- Cada persona sube solo a su carpeta (su id); el admin las ve en el pedido. Máximo 10 MB por foto.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-photos', 'custom-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public reads custom photos" on storage.objects;
create policy "Public reads custom photos" on storage.objects for select using (bucket_id = 'custom-photos');
drop policy if exists "Customers upload own custom photos" on storage.objects;
create policy "Customers upload own custom photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'custom-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Customers delete own custom photos" on storage.objects;
create policy "Customers delete own custom photos" on storage.objects for delete
  using (bucket_id = 'custom-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_admin_role()));
