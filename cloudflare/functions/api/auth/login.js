import { ensureUsersSchema, json, signToken, verifyPassword } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password, turnstileToken } = await request.json().catch(() => ({}));
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!env.DB) return json({ error: 'Falta configurar el binding D1 DB en Cloudflare.' }, 500);
    if (!env.JWT_SECRET) return json({ error: 'Falta configurar el secreto JWT_SECRET en Cloudflare.' }, 500);
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) return json({ error: 'Completa el captcha antes de iniciar sesión.' }, 400);
      const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken }) });
      const captcha = await captchaResponse.json();
      if (!captcha.success) return json({ error: `Turnstile rechazó la validación: ${(captcha['error-codes'] || ['clave secreta o widget incorrectos']).join(', ')}` }, 400);
      if (captcha.action && captcha.action !== 'login') return json({ error: 'Turnstile devolvió una acción distinta a login.' }, 400);
      if (captcha.hostname && captcha.hostname !== new URL(request.url).hostname) return json({ error: 'Turnstile devolvió un hostname distinto al sitio actual.' }, 400);
    }
    await ensureUsersSchema(env.DB);
    const user = await env.DB.prepare('SELECT id, name, email, phone, role, password_hash, verified_at FROM users WHERE email = ?')
      .bind(normalizedEmail).first();
    if (!user || !(await verifyPassword(String(password || ''), user.password_hash))) return json({ error: 'Credenciales incorrectas' }, 401);
    if (!user.verified_at && user.role === 'customer') return json({ error: 'Verifica tu correo antes de entrar' }, 403);

    const { password_hash: _passwordHash, verified_at: _verifiedAt, ...publicUser } = user;
    return json({ token: await signToken(publicUser, env.JWT_SECRET), user: publicUser });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno del inicio de sesión.' }, 500);
  }
}
