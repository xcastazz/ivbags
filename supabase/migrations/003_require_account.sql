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
