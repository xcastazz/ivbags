export async function onRequestGet({ env }) {
  const checks = { DB: Boolean(env.DB), AUTH_KV: Boolean(env.AUTH_KV), JWT_SECRET: Boolean(env.JWT_SECRET), TURNSTILE_SECRET_KEY: Boolean(env.TURNSTILE_SECRET_KEY) };
  let database = false;
  if (env.DB) {
    try {
      await env.DB.prepare('SELECT 1').first();
      database = true;
    } catch {
      database = false;
    }
  }
  return Response.json({ ok: checks.DB && checks.AUTH_KV && checks.JWT_SECRET && database, service: 'ivbags-pages-api', checks, database });
}
