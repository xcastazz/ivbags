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