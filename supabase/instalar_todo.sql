-- IV Bags · instalación completa (001 a 004). Solo para una base nueva: pegar entero en Supabase > SQL Editor > Run.

-- ═════ 001_initial_schema.sql ═════
create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('new', 'quoted', 'confirmed', 'in_production', 'shipped', 'completed', 'cancelled');
create type public.invoice_status as enum ('draft', 'issued', 'void');
create sequence public.invoice_sequence start 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents >= price_cents),
  image_url text,
  inventory_count integer not null default 0 check (inventory_count >= 0),
  made_to_order boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references public.profiles(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status public.order_status not null default 'new',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'COP',
  notes text,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  customization jsonb,
  created_at timestamptz not null default now()
);

create table public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  reference_image_url text,
  status public.order_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null default ('IV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_sequence')::text, 5, '0')),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  status public.invoice_status not null default 'draft',
  issue_date date,
  due_date date,
  billing_snapshot jsonb not null default '{}'::jsonb,
  subtotal_cents integer not null,
  tax_cents integer not null default 0,
  total_cents integer not null,
  pdf_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.has_admin_role()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create trigger products_touch_updated_at before update on public.products for each row execute procedure public.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_requests enable row level security;
alter table public.invoices enable row level security;

create policy "Public can view active products" on public.products for select using (active or public.has_admin_role());
create policy "Admins manage products" on public.products for all using (public.has_admin_role()) with check (public.has_admin_role());
create policy "Customers view their profile" on public.profiles for select using (id = auth.uid() or public.has_admin_role());
create policy "Customers update their profile" on public.profiles for update using (id = auth.uid());
create policy "Admins manage profiles" on public.profiles for all using (public.has_admin_role()) with check (public.has_admin_role());
create policy "Customers view their orders" on public.orders for select using (customer_id = auth.uid() or public.has_admin_role());
create policy "Admins manage orders" on public.orders for all using (public.has_admin_role()) with check (public.has_admin_role());
create policy "Order items follow order access" on public.order_items for select using (exists(select 1 from public.orders where id = order_id and (customer_id = auth.uid() or public.has_admin_role())));
create policy "Admins manage order items" on public.order_items for all using (public.has_admin_role()) with check (public.has_admin_role());
create policy "Anyone may request a customization" on public.custom_requests for insert with check (true);
create policy "Customers view own requests" on public.custom_requests for select using (customer_id = auth.uid() or public.has_admin_role());
create policy "Admins manage requests" on public.custom_requests for all using (public.has_admin_role()) with check (public.has_admin_role());
create policy "Admins manage invoices" on public.invoices for all using (public.has_admin_role()) with check (public.has_admin_role());
-- ═════ 002_store_features.sql ═════
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

-- ═════ 003_require_account.sql ═════
-- Comprar y pedir personalizados requiere haber iniciado sesión.

-- Pedidos: solo usuarias autenticadas pueden llamar a create_order.
-- (Insertar directo en orders ya está bloqueado por RLS para todos menos admin.)
revoke execute on function public.create_order(text, text, text, text, text, text, text, jsonb) from anon, public;
grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb) to authenticated;

-- Personalizados: la solicitud queda ligada a la cuenta de quien la envía.
drop policy if exists "Anyone may request a customization" on public.custom_requests;
drop policy if exists "Signed-in customers request a customization" on public.custom_requests;
create policy "Signed-in customers request a customization" on public.custom_requests
  for insert to authenticated with check (status = 'new' and customer_id = auth.uid());

-- ═════ 004_consent.sql ═════
-- Aceptación de términos, privacidad y tratamiento de datos (Ley 1581 de 2012) al iniciar sesión.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_updated_at timestamptz;

-- Seguridad: una persona puede editar su perfil, pero nunca darse a sí misma el rol de admin.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.has_admin_role() and auth.uid() is not null then
    raise exception 'Solo un admin puede cambiar roles';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute procedure public.protect_profile_role();
