-- Favoritos de la semana: cuántas veces se ve, se guarda, se agrega a la bolsa o se pregunta por cada producto.
-- Junto con las compras pagadas de los últimos 7 días arma el ranking que se muestra en la tienda.

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('view', 'fav', 'cart', 'whatsapp')),
  created_at timestamptz not null default now()
);
create index if not exists product_events_recent on public.product_events (created_at, product_id);

-- Nadie lee ni escribe la tabla directamente: se registra con track_product_event y se consulta con weekly_favorites.
alter table public.product_events enable row level security;
drop policy if exists "Admins read product events" on public.product_events;
create policy "Admins read product events" on public.product_events for select using (public.has_admin_role());

create or replace function public.track_product_event(p_product uuid, p_kind text)
returns void language sql security definer set search_path = public as $$
  insert into public.product_events (product_id, kind)
  select id, p_kind from public.products where id = p_product and active and p_kind in ('view', 'fav', 'cart', 'whatsapp');
$$;
grant execute on function public.track_product_event(uuid, text) to anon, authenticated;

-- Puntaje: vista 1, favorito 3, WhatsApp 3, bolsa 4, unidad comprada 10.
create or replace function public.weekly_favorites()
returns table (product_id uuid, views integer, interactions integer, purchases integer, score integer)
language sql stable security definer set search_path = public as $$
  with ev as (
    select e.product_id,
      count(*) filter (where kind = 'view')::integer as views,
      count(*) filter (where kind <> 'view')::integer as interactions,
      sum(case kind when 'view' then 1 when 'cart' then 4 else 3 end)::integer as pts
    from public.product_events e
    where e.created_at > now() - interval '7 days'
    group by e.product_id
  ), buys as (
    select i.product_id, sum(i.quantity)::integer as units
    from public.order_items i join public.orders o on o.id = i.order_id
    where o.payment_status = 'approved' and o.created_at > now() - interval '7 days' and i.product_id is not null
    group by i.product_id
  )
  select p.id, coalesce(ev.views, 0), coalesce(ev.interactions, 0), coalesce(buys.units, 0),
    coalesce(ev.pts, 0) + 10 * coalesce(buys.units, 0)
  from public.products p
  left join ev on ev.product_id = p.id
  left join buys on buys.product_id = p.id
  where p.active and (ev.product_id is not null or buys.product_id is not null)
  order by 5 desc;
$$;
grant execute on function public.weekly_favorites() to anon, authenticated;
