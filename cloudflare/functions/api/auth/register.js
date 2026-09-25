import { ensureUsersSchema, hashPassword, json, sendVerification, validatePassword } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, password, phone } = await request.json().catch(() => ({}));
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return json({ error: 'Nombre, correo y contraseña son obligatorios' }, 400);
    const passwordError = validatePassword(password);
    if (passwordError) return json({ error: passwordError }, 400);
    if (!env.DB) return json({ error: 'Falta configurar el binding D1 DB en Cloudflare.' }, 500);
    if (!env.AUTH_KV) return json({ error: 'Falta configurar el binding KV AUTH_KV en Cloudflare.' }, 500);
    await ensureUsersSchema(env.DB);

    const existing = await env.DB.prepare('SELECT id, verified_at FROM users WHERE email = ?').bind(normalizedEmail).first();
    if (existing?.verified_at) return json({ error: 'Ese correo ya está registrado' }, 409);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const createdAt = new Date().toISOString();
    const passwordHash = await hashPassword(String(password));
    const result = existing
      ? { meta: { last_row_id: existing.id } }
      : await env.DB.prepare('INSERT INTO users (name, email, password_hash, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(String(name).trim(), normalizedEmail, passwordHash, phone || null, 'customer', createdAt)
        .run();

    if (existing) {
      await env.DB.prepare('UPDATE users SET name = ?, password_hash = ?, phone = ?, role = ?, verified_at = NULL WHERE id = ?')
        .bind(String(name).trim(), passwordHash, phone || null, 'customer', existing.id).run();
    }

    await env.AUTH_KV.put(`verification:${normalizedEmail}`, JSON.stringify({ userId: result.meta.last_row_id, code }), { expirationTtl: 900 });
    try {
      await sendVerification(env, normalizedEmail, code);
    } catch (error) {
      return json({ message: 'Cuenta creada, pero el correo no pudo enviarse todavía. Puedes reenviar el código.', warning: error instanceof Error ? error.message : 'Revisa la configuración de Resend.', verificationRequired: true }, 202);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno del registro.' }, 500);
  }
  return json({ message: 'Cuenta creada. Revisa tu correo para verificarla.' }, 201);
}
