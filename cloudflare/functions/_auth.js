const encoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password) {
  const salt = crypto.randomUUID();
  return `pbkdf2:${salt}:${await derivePassword(password, salt)}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, salt, expected] = String(storedHash || '').split(':');
  return algorithm === 'pbkdf2' && Boolean(salt && expected && (await derivePassword(password, salt)) === expected);
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (!/[a-z]/.test(value)) return 'La contraseña debe incluir una letra minúscula.';
  if (!/[A-Z]/.test(value)) return 'La contraseña debe incluir una letra mayúscula, pero no es obligatorio que sea la primera.';
  if (!/\d/.test(value)) return 'La contraseña debe incluir un número.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'La contraseña debe incluir un símbolo.';
  return null;
}

async function ensureUsersSchema(db) {
  const columns = await db.prepare('PRAGMA table_info(users)').all();
  const names = new Set(columns.results.map((column) => column.name));
  if (!names.has('phone')) await db.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run();
  if (!names.has('role')) await db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'").run();
  if (!names.has('verified_at')) await db.prepare('ALTER TABLE users ADD COLUMN verified_at TEXT').run();
}

function base64url(value) {
  const bytes = new TextEncoder().encode(value);
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeBase64url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
}

async function signToken(user, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
}

async function verifyToken(token, secret) {
  const [encodedHeader, encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
  const decode = (value) => JSON.parse(new TextDecoder().decode(Uint8Array.from(decodeBase64url(value), (char) => char.charCodeAt(0))));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signature = Uint8Array.from(decodeBase64url(encodedSignature), (char) => char.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(`${encodedHeader}.${encodedPayload}`));
  const payload = decode(encodedPayload);
  return valid && payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}

async function sendVerification(env, email, code) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error('Configura RESEND_API_KEY y RESEND_FROM en Cloudflare para enviar códigos de verificación.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [email],
      subject: 'Confirma tu cuenta de iv bags',
      text: `Tu código de verificación es ${code}. Expira en 15 minutos.`,
    }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || details.name || 'Resend rechazó el correo de verificación. Revisa RESEND_FROM y el dominio autorizado.');
  }
}

export { digest, ensureUsersSchema, hashPassword, json, sendVerification, signToken, validatePassword, verifyPassword, verifyToken };
