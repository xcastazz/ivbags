import { json } from '../../_auth.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('hub.verify_token') !== env.WHATSAPP_VERIFY_TOKEN) return new Response('Forbidden', { status: 403 });
  return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
}

export async function onRequestPost({ request, env }) {
  const payload = await request.json().catch(() => ({}));
  const changes = payload.entry?.flatMap((entry) => entry.changes || []) || [];
  for (const change of changes) {
    for (const message of change.value?.messages || []) {
      const contact = change.value?.contacts?.find((item) => item.wa_id === message.from);
      const body = message.text?.body || '[Mensaje multimedia]';
      await env.DB.prepare('INSERT INTO whatsapp_messages (wa_id, customer_name, direction, body, provider_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(message.from, contact?.profile?.name || null, 'inbound', body, message.id || null, new Date().toISOString()).run();
    }
  }
  return json({ received: true });
}
