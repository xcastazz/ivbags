import { ensureUsersSchema, json, verifyToken } from '../_auth.js';

async function ensureOrderItemsSchema(db) {
  const columns = await db.prepare('PRAGMA table_info(orders)').all();
  if (!columns.results.some((column) => column.name === 'items_json')) await db.prepare('ALTER TABLE orders ADD COLUMN items_json TEXT').run();
}

export async function onRequestGet({ request, env }) {
  try {
    const reference = new URL(request.url).searchParams.get('reference')?.replace(/^#/, '').trim();
    if (!reference) return json({ error: 'Escribe un número de pedido.' }, 400);
    const order = await env.DB.prepare(`SELECT o.reference, o.total, o.status, o.payment_status, o.delivery_json, o.design_json, o.created_at, u.name AS customer_name FROM orders o JOIN users u ON u.id = o.user_id WHERE replace(o.reference, '#', '') = ?`).bind(reference).first();
    if (!order) return json({ error: 'No encontramos ese pedido. Revisa el número e inténtalo de nuevo.' }, 404);
    await ensureOrderItemsSchema(env.DB);
    return json({ ...order, delivery: JSON.parse(order.delivery_json || '{}'), design: JSON.parse(order.design_json || '[]'), items: JSON.parse(order.items_json || '[]') });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'No se pudo consultar el pedido.' }, 500); }
}

export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const payload = await request.json().catch(() => ({}));
    let user = await verifyToken(token, env.JWT_SECRET);
    if (!user && !payload.demo) return json({ error: 'Autenticación requerida' }, 401);
    await ensureUsersSchema(env.DB);
    await ensureOrderItemsSchema(env.DB);
    const { items, delivery, design, demo } = payload;
    if (!Array.isArray(items) || !items.length || !delivery?.phone) return json({ error: 'El carrito y WhatsApp son obligatorios' }, 400);
    if (!user && demo) {
      const email = String(delivery.email || `demo-${Date.now()}@ivbags.local`).trim().toLowerCase();
      user = await env.DB.prepare('SELECT id, email, role FROM users WHERE email = ?').bind(email).first();
      if (!user) { const created = await env.DB.prepare('INSERT INTO users (name, email, password_hash, phone, role, verified_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(delivery.name || 'Cliente demo', email, 'demo', delivery.phone, 'customer', new Date().toISOString(), new Date().toISOString()).run(); user = { id: created.meta.last_row_id, email, role: 'customer' }; }
    }
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) + Math.max(0, Number(delivery.shippingFee || 0));
    const reference = `IV-${Date.now()}`;
    const requestedStock = new Map();
    items.forEach((item) => { if (item.productId) requestedStock.set(Number(item.productId), (requestedStock.get(Number(item.productId)) || 0) + Number(item.quantity || 1)); });
    for (const [productId, quantity] of requestedStock) { const product = await env.DB.prepare('SELECT name, stock FROM products WHERE id = ? AND status = ?').bind(productId, 'available').first(); if (!product || Number(product.stock) < quantity) return json({ error: `No hay stock suficiente de ${product?.name || 'uno de los productos'}. Disponible: ${product?.stock || 0}.` }, 409); }
    for (const [productId, quantity] of requestedStock) await env.DB.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').bind(quantity, productId, quantity).run();
    await env.DB.prepare('INSERT INTO orders (reference, user_id, total, status, payment_status, delivery_json, design_json, items_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(reference, user.id || user.sub, total, demo ? 'demo' : 'pending', demo ? 'demo' : 'pending', JSON.stringify(delivery), JSON.stringify(design || items), JSON.stringify(items), new Date().toISOString()).run();
    return json({ reference, total, status: 'pending' }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo crear el pedido.' }, 500);
  }
}
