import { json } from '../../_auth.js';

export async function onRequestGet({ request, env }) {
  if (request.headers.get('X-Admin-Password') !== (env.ADMIN_PASSWORD || '12345678')) return json({ error: 'Acceso de administrador requerido' }, 401);
  const orders = await env.DB.prepare(`SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`).all();
  return json(orders.results.map((order) => ({ ...order, delivery: JSON.parse(order.delivery_json || '{}'), design: JSON.parse(order.design_json || '[]'), items: JSON.parse(order.items_json || '[]') })));
}

export async function onRequestPatch({ request, env }) {
  if (request.headers.get('X-Admin-Password') !== (env.ADMIN_PASSWORD || '12345678')) return json({ error: 'Acceso de administrador requerido' }, 401);
  const { reference, status, total } = await request.json().catch(() => ({}));
  if (!reference || (!status && !Number.isFinite(Number(total)))) return json({ error: 'Referencia y estado o monto son obligatorios' }, 400);
  if (status) await env.DB.prepare('UPDATE orders SET status = ? WHERE reference = ?').bind(status, reference).run();
  if (Number.isFinite(Number(total)) && Number(total) >= 0) await env.DB.prepare('UPDATE orders SET total = ? WHERE reference = ?').bind(Math.round(Number(total)), reference).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (request.headers.get('X-Admin-Password') !== (env.ADMIN_PASSWORD || '12345678')) return json({ error: 'Acceso de administrador requerido' }, 401);
  const reference = new URL(request.url).searchParams.get('reference')?.replace(/^#/, '').trim();
  if (!reference) return json({ error: 'La referencia del pedido es obligatoria' }, 400);
  const result = await env.DB.prepare('DELETE FROM orders WHERE reference = ?').bind(reference).run();
  if (!result.meta.changes) return json({ error: 'No encontramos esa venta' }, 404);
  return json({ ok: true, reference });
}
