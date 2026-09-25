import { ensureUsersSchema, json, signToken } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  const { email, code } = await request.json().catch(() => ({}));
  if (!env.DB) return json({ error: 'Falta configurar el binding D1 DB en Cloudflare.' }, 500);
  await ensureUsersSchema(env.DB);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const verification = await env.AUTH_KV.get(`verification:${normalizedEmail}`, 'json');
  if (!verification || String(verification.code) !== String(code || '')) return json({ error: 'Código inválido o expirado' }, 400);

  const user = await env.DB.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ? AND email = ?')
    .bind(verification.userId, normalizedEmail).first();
  if (!user) return json({ error: 'Usuario no encontrado' }, 404);

  await env.DB.prepare('UPDATE users SET verified_at = ? WHERE id = ?').bind(new Date().toISOString(), user.id).run();
  await env.AUTH_KV.delete(`verification:${normalizedEmail}`);
  return json({ token: await signToken(user, env.JWT_SECRET), user });
}
