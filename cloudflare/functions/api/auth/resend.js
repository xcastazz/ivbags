import { ensureUsersSchema, json, sendVerification } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json().catch(() => ({}));
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return json({ error: 'Escribe tu correo electrónico.' }, 400);
    if (!env.DB) return json({ error: 'Falta configurar el binding D1 DB en Cloudflare.' }, 500);
    if (!env.AUTH_KV) return json({ error: 'Falta configurar el binding KV AUTH_KV en Cloudflare.' }, 500);
    await ensureUsersSchema(env.DB);

    const user = await env.DB.prepare('SELECT id, verified_at FROM users WHERE email = ?').bind(normalizedEmail).first();
    if (!user) return json({ error: 'No existe una cuenta con ese correo.' }, 404);
    if (user.verified_at) return json({ error: 'Este correo ya está verificado. Puedes iniciar sesión.' }, 409);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await env.AUTH_KV.put(`verification:${normalizedEmail}`, JSON.stringify({ userId: user.id, code }), { expirationTtl: 900 });
    await sendVerification(env, normalizedEmail, code);
    return json({ message: 'Código reenviado. Revisa tu correo.' });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo reenviar el código.' }, 500);
  }
}
