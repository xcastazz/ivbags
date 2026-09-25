import { json } from '../../_auth.js';

export async function onRequestGet({ request, env }) {
  if (request.headers.get('X-Admin-Password') !== (env.ADMIN_PASSWORD || '12345678')) return json({ error: 'Acceso de administrador requerido' }, 401);
  const result = await env.DB.prepare(`SELECT u.id, u.name, u.email, u.phone, u.verified_at, u.created_at, COUNT(o.id) AS order_count, MAX(o.created_at) AS last_order_at, COALESCE(SUM(o.total), 0) AS total_spent FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.created_at DESC`).all();
  return json(result.results);
}
