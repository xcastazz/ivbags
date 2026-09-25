import { json, verifyToken } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!await verifyToken(token, env.JWT_SECRET)) return json({ error: 'Autenticación requerida' }, 401);
  const { reference, amount } = await request.json().catch(() => ({}));
  const numericAmount = Number(amount);
  if (!reference || !Number.isFinite(numericAmount)) return json({ error: 'Referencia y valor inválidos' }, 400);
  if (!env.WOMPI_INTEGRITY_SECRET || !env.WOMPI_PUBLIC_KEY) return json({ error: 'Wompi no está configurado todavía en Cloudflare.' }, 503);
  const currency = 'COP';
  const amountInCents = numericAmount * 100;
  const data = new TextEncoder().encode(`${reference}${amountInCents}${currency}${env.WOMPI_INTEGRITY_SECRET}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const signature = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return json({ reference, amountInCents, currency, signature, publicKey: env.WOMPI_PUBLIC_KEY });
}
