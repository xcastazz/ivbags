import { json } from '../../_auth.js';

function authorized(request, env) {
  return request.headers.get('X-Admin-Password') === (env.ADMIN_PASSWORD || '12345678');
}

function username(request) {
  return request.headers.get('X-Admin-Username') || 'admin';
}

async function ensureProfileSchema(db) {
  await db.prepare('CREATE TABLE IF NOT EXISTS admin_profiles (username TEXT PRIMARY KEY, display_name TEXT NOT NULL, photo_key TEXT, photo_data TEXT, updated_at TEXT NOT NULL)').run();
  const columns = await db.prepare('PRAGMA table_info(admin_profiles)').all();
  if (!columns.results.some((column) => column.name === 'photo_data')) await db.prepare('ALTER TABLE admin_profiles ADD COLUMN photo_data TEXT').run();
}

export async function onRequestGet({ request, env }) {
  try { if (!authorized(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401); await ensureProfileSchema(env.DB); const profile = await env.DB.prepare('SELECT username, display_name, photo_key, photo_data, updated_at FROM admin_profiles WHERE username = ?').bind(username(request)).first(); return json(profile ? { ...profile, photo_url: profile.photo_key && env.PROFILE_PHOTOS ? `/api/admin/profile-photo?key=${encodeURIComponent(profile.photo_key)}` : profile.photo_data || null } : { username: username(request), display_name: username(request), photo_url: null }); } catch (error) { return json({ error: error instanceof Error ? error.message : 'No se pudo cargar el perfil.' }, 500); }
}

export async function onRequestPut({ request, env }) {
  try { if (!authorized(request, env)) return json({ error: 'Acceso de administrador requerido' }, 401); await ensureProfileSchema(env.DB); const form = await request.formData(); const displayName = String(form.get('displayName') || '').trim(); if (!displayName) return json({ error: 'El nombre visible es obligatorio' }, 400); const photo = form.get('photo'); const key = `${username(request)}-${crypto.randomUUID()}`; let photoData = null; if (photo && typeof photo.arrayBuffer === 'function' && photo.size > 0) { if (env.PROFILE_PHOTOS) { await env.PROFILE_PHOTOS.put(key, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type || 'image/jpeg' } }); } else { const bytes = new Uint8Array(await photo.arrayBuffer()); let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); photoData = `data:${photo.type || 'image/jpeg'};base64,${btoa(binary)}`; } } await env.DB.prepare('INSERT INTO admin_profiles (username, display_name, photo_key, photo_data, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(username) DO UPDATE SET display_name = excluded.display_name, photo_key = COALESCE(excluded.photo_key, admin_profiles.photo_key), photo_data = COALESCE(excluded.photo_data, admin_profiles.photo_data), updated_at = excluded.updated_at').bind(username(request), displayName, photo && photo.size > 0 && env.PROFILE_PHOTOS ? key : null, photoData, new Date().toISOString()).run(); return json({ username: username(request), display_name: displayName, photo_key: key, photo_url: photoData }); } catch (error) { return json({ error: error instanceof Error ? error.message : 'No se pudo guardar el perfil.' }, 500); }
}
