-- Dirección de envío completa (departamento, vía, barrio, complemento, documento, quién recibe…).
-- place_order reemplaza a create_order: guarda la dirección por partes en orders.shipping_address.

alter table public.orders add column if not exists department text;
alter table public.profiles add column if not exists saved_shipping jsonb;

create or replace function public.place_order(p_shipping jsonb, p_notes text, p_payment text, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer := coalesce((select (value ->> 'shippingCents')::integer from public.site_content where key = 'site'), 0);
  v_name text := trim(coalesce(p_shipping ->> 'name', ''));
  v_email text := trim(coalesce(p_shipping ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'Inicia sesión para hacer un pedido'; end if;
  if v_name = '' or v_email = '' or coalesce(trim(p_shipping ->> 'street'), '') = '' or coalesce(trim(p_shipping ->> 'city'), '') = '' or coalesce(trim(p_shipping ->> 'department'), '') = '' then
    raise exception 'Faltan datos de envío';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La bolsa está vacía';
  end if;

  insert into public.orders (customer_id, customer_name, customer_email, customer_phone, city, department, notes, payment_method, shipping_address, shipping_cents)
  values (auth.uid(), v_name, v_email, p_shipping ->> 'phone', p_shipping ->> 'city', p_shipping ->> 'department', p_notes, p_payment, p_shipping, v_shipping)
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

  -- Recuerda la dirección para la próxima compra si la persona lo pidió.
  if coalesce((p_shipping ->> 'save')::boolean, false) then
    update public.profiles set saved_shipping = p_shipping - 'save' where id = auth.uid();
  end if;

  return jsonb_build_object('order_number', v_order.order_number, 'subtotal_cents', v_subtotal, 'shipping_cents', v_shipping, 'total_cents', v_subtotal + v_shipping);
end;
$$;
revoke execute on function public.place_order(jsonb, text, text, jsonb) from anon, public;
grant execute on function public.place_order(jsonb, text, text, jsonb) to authenticated;
