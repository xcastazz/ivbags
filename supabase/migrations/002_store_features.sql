-- IV Bags · tienda funcional: catálogo completo, contenido editable, blog,
-- mensajes de contacto, creación segura de pedidos y fotos de productos.

-- ───────── Productos ─────────
alter table public.products
  add column if not exists tag text,
  add column if not exists details text,
  add column if not exists images text[] not null default '{}',
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists featured boolean not null default false,
  add column if not exists is_pet boolean not null default false,
  add column if not exists sort_order integer not null default 0;

update public.products set images = array[image_url] where image_url is not null and cardinality(images) = 0;

-- ───────── Pedidos: datos de envío y pago ─────────
alter table public.orders
  add column if not exists payment_method text,
  add column if not exists city text;

-- ───────── Contenido editable del sitio ─────────
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "Anyone reads site content" on public.site_content;
create policy "Anyone reads site content" on public.site_content for select using (true);
drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content" on public.site_content for all using (public.has_admin_role()) with check (public.has_admin_role());
insert into public.site_content (key, value) values ('site', '{}'::jsonb) on conflict (key) do nothing;

-- ───────── Blog: ferias, talleres, eventos y notas ─────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'Feria',
  title text not null,
  place text,
  event_date date,
  body text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists "Anyone reads published posts" on public.posts;
create policy "Anyone reads published posts" on public.posts for select using (published or public.has_admin_role());
drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts for all using (public.has_admin_role()) with check (public.has_admin_role());

-- ───────── Mensajes de contacto ─────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "Anyone sends a message" on public.contact_messages;
create policy "Anyone sends a message" on public.contact_messages for insert with check (status = 'new');
drop policy if exists "Admins manage messages" on public.contact_messages;
create policy "Admins manage messages" on public.contact_messages for all using (public.has_admin_role()) with check (public.has_admin_role());

-- Solicitudes de personalización: contacto por WhatsApp y nunca con estado distinto a 'new' desde la tienda.
alter table public.custom_requests add column if not exists phone text;
alter table public.custom_requests alter column email drop not null;
drop policy if exists "Anyone may request a customization" on public.custom_requests;
create policy "Anyone may request a customization" on public.custom_requests for insert with check (status = 'new');

-- ───────── Crear pedido (precios calculados en la base, no en el navegador) ─────────
create or replace function public.create_order(
  p_name text, p_email text, p_phone text, p_city text, p_address text,
  p_notes text, p_payment text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer := coalesce((select (value ->> 'shippingCents')::integer from public.site_content where key = 'site'), 0);
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Faltan datos de envío';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La bolsa está vacía';
  end if;

  insert into public.orders (customer_id, customer_name, customer_email, customer_phone, city, notes, payment_method, shipping_address, shipping_cents)
  values (auth.uid(), trim(p_name), trim(p_email), p_phone, p_city, p_notes, p_payment,
          jsonb_build_object('address', p_address, 'city', p_city), v_shipping)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and active;
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    v_qty := greatest(1, least(20, coalesce((v_item ->> 'quantity')::integer, 1)));
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price_cents, customization)
    values (v_order.id, v_product.id, v_product.name, v_qty, v_product.price_cents, v_item -> 'customization');
    v_subtotal := v_subtotal + v_qty * v_product.price_cents;
    if not v_product.made_to_order then
      update public.products set inventory_count = greatest(0, inventory_count - v_qty) where id = v_product.id;
    end if;
  end loop;

  update public.orders set subtotal_cents = v_subtotal, total_cents = v_subtotal + v_shipping where id = v_order.id;
  return jsonb_build_object('order_number', v_order.order_number, 'subtotal_cents', v_subtotal, 'shipping_cents', v_shipping, 'total_cents', v_subtotal + v_shipping);
end;
$$;
grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- Los clientes ven sus propios ítems; los admin ya los gestionan.
-- ───────── Fotos de productos y del blog ─────────
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "Public reads media" on storage.objects;
create policy "Public reads media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media" on storage.objects for insert with check (bucket_id = 'media' and public.has_admin_role());
drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media" on storage.objects for update using (bucket_id = 'media' and public.has_admin_role());
drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media" on storage.objects for delete using (bucket_id = 'media' and public.has_admin_role());

-- ───────── Catálogo inicial (solo si está vacío) ─────────
insert into public.products (slug, name, category, tag, price_cents, description, details, images, made_to_order, inventory_count, featured, is_pet, options, sort_order)
select * from (values
  ('tote-pensamiento', 'Tote Pensamiento', 'Bolsos', 'serigrafía', 9500000, 'Tote gris carbón estampado a mano en serigrafía con nuestra ilustración de pensamientos. Forrado, con bolsillo interno y cierre.', 'Tela gris carbón, forro interno, bolsillo y cierre.', array['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'], false, 3, true, false, '[]'::jsonb, 1),
  ('bolso-mascota', 'Bolso con tu mascota', 'Personalizados con mascotas', 'pintado a mano', 13000000, 'Pintamos a mano a tu mascota en un bolso de tela cruda (beige), dentro del marco floral que elijas. Puedes agregarle su nombre sin costo.', 'Tela cruda (beige) con cierre, forro y bolsillos.', array['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80'], true, 0, true, true, '[{"key":"tamano","label":"Tamaño","values":["Baguette","Pequeño","Mediano","Grande"],"hint":"Mismo precio en todos"},{"key":"marco","label":"Marco floral","values":["Marco 1","Marco 2","Marco 3"],"hint":"A tu elección"}]'::jsonb, 2),
  ('camiseta-pensamiento', 'Camiseta Pensamiento', 'Prendas', 'serigrafía', 11000000, 'Vinotinto, estampada en serigrafía: un ramo de pensamientos dentro de un marco festoneado.', 'Algodón. Estampado en serigrafía.', array['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'], false, 4, true, false, '[{"key":"modelo","label":"Modelo","values":["Camiseta","Blusa esqueleto"]},{"key":"talla","label":"Talla","values":["S","M","L","XL"]}]'::jsonb, 3),
  ('cosmetiquera-pintada', 'Cosmetiquera pintada', 'Accesorios', 'pintado a mano', 4800000, 'Cosmetiquera en lona con cierre, pintada a mano por encargo. Cada una es única.', 'Lona con cierre.', array['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80'], true, 0, true, false, '[]'::jsonb, 4)
) as seed(slug, name, category, tag, price_cents, description, details, images, made_to_order, inventory_count, featured, is_pet, options, sort_order)
where not exists (select 1 from public.products);
