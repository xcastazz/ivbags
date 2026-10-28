-- Envío por zona: Medellín (domiciliario) $12.000, Bello/Itagüí/Sabaneta/Envigado $15.000, resto del país $18.000.
-- Debe coincidir con src/lib/shipping.ts.

create or replace function public.shipping_for(p_city text, p_department text)
returns integer language sql immutable set search_path = public as $$
  select case
    when lower(translate(btrim(coalesce(p_department, '')), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) = 'antioquia'
     and lower(translate(btrim(coalesce(p_city, '')), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) = 'medellin' then 1200000
    when lower(translate(btrim(coalesce(p_department, '')), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) = 'antioquia'
     and lower(translate(btrim(coalesce(p_city, '')), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) in ('bello', 'itagui', 'sabaneta', 'envigado') then 1500000
    else 1800000
  end;
$$;
grant execute on function public.shipping_for(text, text) to anon, authenticated;

-- place_order cobra el envío según la ciudad.
create or replace function public.place_order(p_shipping jsonb, p_notes text, p_payment text, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer := public.shipping_for(p_shipping ->> 'city', p_shipping ->> 'department');
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
