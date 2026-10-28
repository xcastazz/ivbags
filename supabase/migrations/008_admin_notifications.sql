-- Notificaciones del panel: cada novedad de la tienda queda registrada aquí
-- y llega en tiempo real al panel de admin.

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order', 'payment', 'payment_failed', 'custom_request', 'message', 'customer')),
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;
drop policy if exists "Admins manage notifications" on public.admin_notifications;
create policy "Admins manage notifications" on public.admin_notifications for all using (public.has_admin_role()) with check (public.has_admin_role());

create or replace function public.notify_admin(p_kind text, p_title text, p_body text, p_href text)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_notifications (kind, title, body, href) values (p_kind, p_title, p_body, p_href);
$$;
revoke all on function public.notify_admin(text, text, text, text) from public, anon, authenticated;

-- Pedido nuevo
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin('order', 'Nuevo pedido #' || new.order_number,
    new.customer_name || ' · $ ' || to_char(new.total_cents / 100, 'FM999G999G999'), '/admin/pedidos');
  return new;
end;
$$;
drop trigger if exists admin_notify_order on public.orders;
create trigger admin_notify_order after insert on public.orders for each row execute procedure public.notify_new_order();

-- Pago aprobado o rechazado
create or replace function public.notify_order_payment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.payment_status is distinct from old.payment_status then
    if new.payment_status = 'approved' then
      perform public.notify_admin('payment', 'Pago recibido · pedido #' || new.order_number,
        new.customer_name || ' pagó $ ' || to_char(new.total_cents / 100, 'FM999G999G999'), '/admin/pedidos');
    elsif new.payment_status in ('declined', 'error') then
      perform public.notify_admin('payment_failed', 'Pago rechazado · pedido #' || new.order_number,
        new.customer_name || ' intentó pagar y no pasó.', '/admin/pedidos');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists admin_notify_payment on public.orders;
create trigger admin_notify_payment after update of payment_status on public.orders for each row execute procedure public.notify_order_payment();

-- Solicitud de personalizado
create or replace function public.notify_custom_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin('custom_request', 'Nueva solicitud de personalizado', new.name || ': ' || left(new.message, 120), '/admin/solicitudes');
  return new;
end;
$$;
drop trigger if exists admin_notify_custom_request on public.custom_requests;
create trigger admin_notify_custom_request after insert on public.custom_requests for each row execute procedure public.notify_custom_request();

-- Mensaje de contacto
create or replace function public.notify_contact_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin('message', 'Nuevo mensaje de ' || new.name, left(new.message, 120), '/admin/mensajes');
  return new;
end;
$$;
drop trigger if exists admin_notify_message on public.contact_messages;
create trigger admin_notify_message after insert on public.contact_messages for each row execute procedure public.notify_contact_message();

-- Clienta nueva
create or replace function public.notify_new_customer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin('customer', 'Nueva clienta registrada', coalesce(nullif(new.full_name, ''), 'Sin nombre todavía'), '/admin/clientes');
  return new;
end;
$$;
drop trigger if exists admin_notify_customer on public.profiles;
create trigger admin_notify_customer after insert on public.profiles for each row execute procedure public.notify_new_customer();

-- Tiempo real
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications') then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
end $$;
