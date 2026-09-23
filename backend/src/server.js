import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();
const port = Number(process.env.PORT || 8787);
const root = process.cwd();
const uploadDir = path.resolve(root, process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const db = new Database(path.resolve(root, 'ivbags.sqlite'));
const jwtSecret = process.env.JWT_SECRET || 'development-only-secret';

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) || true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });

function now() { return new Date().toISOString(); }
function sign(user) { return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' }); }
function auth(req, res, next) { try { const token = req.headers.authorization?.replace('Bearer ', ''); req.user = jwt.verify(token, jwtSecret); next(); } catch { res.status(401).json({ error: 'Autenticación requerida' }); } }
function role(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Permisos insuficientes' }); }
function sendVerification(email, code) {
  if (!process.env.SMTP_HOST) return Promise.resolve();
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  return transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject: 'Confirma tu cuenta de iv bags', text: `Tu código de verificación es ${code}. Expira en 15 minutos.` });
}

db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, phone TEXT, role TEXT NOT NULL DEFAULT 'customer', verified_at TEXT, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS verification_codes (user_id INTEGER PRIMARY KEY, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, stock INTEGER NOT NULL DEFAULT 0, image_url TEXT, status TEXT NOT NULL DEFAULT 'available', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'pending', delivery_json TEXT NOT NULL, design_json TEXT, created_at TEXT NOT NULL);`);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ivbags-api', time: now() }));
app.post('/api/auth/register', async (req, res) => { const { name, email, password, phone } = req.body; if (!name || !email || !password) return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' }); if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' }); try { const hash = await bcrypt.hash(password, 12); const result = db.prepare('INSERT INTO users (name,email,password_hash,phone,created_at) VALUES (?,?,?,?,?)').run(name.trim(), email.toLowerCase().trim(), hash, phone || null, now()); const code = String(crypto.randomInt(100000, 1000000)); db.prepare('INSERT OR REPLACE INTO verification_codes (user_id,code_hash,expires_at) VALUES (?,?,?)').run(result.lastInsertRowid, await bcrypt.hash(code, 10), new Date(Date.now() + 15 * 60 * 1000).toISOString()); await sendVerification(email, code); res.status(201).json({ message: 'Cuenta creada. Revisa tu correo para verificarla.' }); } catch { res.status(409).json({ error: 'Ese correo ya está registrado' }); } });
app.post('/api/auth/verify', async (req, res) => { const { email, code } = req.body; const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase().trim()); const verification = user && db.prepare('SELECT * FROM verification_codes WHERE user_id = ?').get(user.id); if (!user || !verification || new Date(verification.expires_at) < new Date() || !(await bcrypt.compare(String(code), verification.code_hash))) return res.status(400).json({ error: 'Código inválido o expirado' }); db.prepare('UPDATE users SET verified_at = ? WHERE id = ?').run(now(), user.id); db.prepare('DELETE FROM verification_codes WHERE user_id = ?').run(user.id); res.json({ token: sign({ ...user, role: 'customer' }), user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }); });
app.post('/api/auth/login', async (req, res) => { const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email?.toLowerCase().trim()); if (!user || !(await bcrypt.compare(req.body.password || '', user.password_hash))) return res.status(401).json({ error: 'Credenciales incorrectas' }); if (!user.verified_at && user.role === 'customer') return res.status(403).json({ error: 'Verifica tu correo antes de entrar' }); res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } }); });
app.get('/api/products', (_req, res) => res.json(db.prepare('SELECT * FROM products WHERE status = ? ORDER BY created_at DESC').all('available')));
app.post('/api/products', auth, role('owner', 'admin'), upload.single('image'), (req, res) => { const result = db.prepare('INSERT INTO products (name,category,price,stock,image_url,created_at) VALUES (?,?,?,?,?,?)').run(req.body.name, req.body.category, Number(req.body.price), Number(req.body.stock || 0), req.file ? `/uploads/${req.file.filename}` : null, now()); res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)); });
app.post('/api/orders', auth, (req, res) => { const { items, delivery, design } = req.body; if (!items?.length || !delivery?.phone) return res.status(400).json({ error: 'El carrito y WhatsApp son obligatorios' }); const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0); const reference = `IV-${Date.now()}`; db.prepare('INSERT INTO orders (reference,user_id,total,delivery_json,design_json,created_at) VALUES (?,?,?,?,?,?)').run(reference, req.user.id, total, JSON.stringify(delivery), JSON.stringify(design || items), now()); res.status(201).json({ reference, total, status: 'pending' }); });
app.get('/api/orders', auth, (req, res) => { if (req.user.role === 'customer') return res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)); res.json(db.prepare('SELECT o.*,u.name,u.email,u.phone FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC').all()); });
app.post('/api/wompi/signature', auth, (req, res) => { const reference = req.body.reference; const amount = Number(req.body.amount); const currency = 'COP'; const integrity = process.env.WOMPI_INTEGRITY_SECRET || ''; const signature = crypto.createHash('sha256').update(`${reference}${amount * 100}${currency}${integrity}`).digest('hex'); res.json({ reference, amountInCents: amount * 100, currency, signature, publicKey: process.env.WOMPI_PUBLIC_KEY }); });
app.post('/api/wompi/webhook', express.json(), (req, res) => { const event = req.body?.event; const data = req.body?.data?.transaction; if (event === 'transaction.updated' && data?.reference) db.prepare('UPDATE orders SET payment_status = ?, status = ? WHERE reference = ?').run(data.status === 'APPROVED' ? 'approved' : data.status.toLowerCase(), data.status === 'APPROVED' ? 'paid' : 'payment_failed', data.reference); res.sendStatus(200); });
app.listen(port, () => console.log(`ivbags API running at http://localhost:${port}`));
