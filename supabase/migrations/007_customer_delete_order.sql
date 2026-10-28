-- El cliente puede eliminar sus propios pedidos que aún no ha pagado (Nuevo o Cotizado).
-- Los pedidos pagados, en producción, enviados o con factura no se pueden borrar.
create or replace function public.delete_my_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where id = p_order_id and customer_id = auth.uid() for update;
  if not found then
    raise exception 'No encontramos ese pedido';
  end if;
  if o.status not in ('new', 'quoted') or coalesce(o.payment_status, 'pending') = 'approved' then
    raise exception 'Este pedido ya está pagado o en proceso y no se puede eliminar';
  end if;
  if exists (select 1 from public.invoices where order_id = o.id) then
    raise exception 'Este pedido ya tiene factura y no se puede eliminar';
  end if;
  delete from public.orders where id = o.id;
end;
$$;

revoke all on function public.delete_my_order(uuid) from public, anon;
grant execute on function public.delete_my_order(uuid) to authenticated;
