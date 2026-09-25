import { json } from '../../_auth.js';

function authorized(request, env) {
  return request.headers.get('X-Admin-Password') === (env.ADMIN_PASSWORD || '12345678');
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401);
  const messages = await env.DB.prepare('SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 100').all();
  return json(messages.results);
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401);
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return json({ error: 'Configura WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID en Cloudflare.' }, 503);
  const { wa_id, body } = await request.json().catch(() => ({}));
  if (!wa_id || !body) return json({ error: 'Destinatario y mensaje son obligatorios' }, 400);
  const response = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: wa_id.replace(/\D/g, ''), type: 'text', text: { body } }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: result.error?.message || 'WhatsApp rechazó el mensaje' }, response.status);
  await env.DB.prepare('INSERT INTO whatsapp_messages (wa_id, direction, body, provider_message_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(wa_id, 'outbound', body, result.messages?.[0]?.id || null, new Date().toISOString()).run();
  return json({ sent: true, provider: result });
}
