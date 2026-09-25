import { json } from '../_auth.js';

function adminAllowed(request, env) {
  const password = request.headers.get('X-Admin-Password');
  return password && password === (env.ADMIN_PASSWORD || '12345678');
}

async function ensureProductSchema(db) {
  const columns = await db.prepare('PRAGMA table_info(products)').all();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has('is_customized')) await db.prepare("ALTER TABLE products ADD COLUMN is_customized INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has('image_urls')) await db.prepare('ALTER TABLE products ADD COLUMN image_urls TEXT').run();
}

export async function onRequestGet({ env }) {
  await ensureProductSchema(env.DB);
  const products = await env.DB.prepare("SELECT * FROM products WHERE status = 'available' ORDER BY created_at DESC").all();
  return json(products.results);
}

export async function onRequestPost({ request, env }) {
  if (!adminAllowed(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401);
  await ensureProductSchema(env.DB);
  const { name, category, price, stock, image_url, image_urls, is_customized } = await request.json().catch(() => ({}));
  if (!name || !category || !Number.isFinite(Number(price))) return json({ error: 'Nombre, categoría y precio son obligatorios' }, 400);
  const result = await env.DB.prepare('INSERT INTO products (name, category, price, stock, image_url, image_urls, is_customized, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(String(name).trim(), String(category), Number(price), Number(stock || 0), image_url || null, JSON.stringify(image_urls || []), Number(Boolean(is_customized)), new Date().toISOString()).run();
  return json(await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(result.meta.last_row_id).first(), 201);
}

export async function onRequestPut({ request, env }) {
  if (!adminAllowed(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401);
  await ensureProductSchema(env.DB);
  const { id, name, category, price, stock, status, image_url, image_urls, is_customized } = await request.json().catch(() => ({}));
  if (!id) return json({ error: 'Producto inválido' }, 400);
  await env.DB.prepare('UPDATE products SET name = COALESCE(?, name), category = COALESCE(?, category), price = COALESCE(?, price), stock = COALESCE(?, stock), status = COALESCE(?, status), image_url = COALESCE(?, image_url), image_urls = COALESCE(?, image_urls), is_customized = COALESCE(?, is_customized) WHERE id = ?')
    .bind(name || null, category || null, price == null ? null : Number(price), stock == null ? null : Number(stock), status || null, image_url || null, image_urls ? JSON.stringify(image_urls) : null, is_customized == null ? null : Number(Boolean(is_customized)), id).run();
  return json(await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first());
}
