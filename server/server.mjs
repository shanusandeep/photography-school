// ============================================================
// The Darkroom — accounts & progress API
// Zero-dependency Node (>=22.5): node:http, node:sqlite, node:crypto
//
// Env:
//   PORT             default 8092
//   DATA_DIR         default ./data (sqlite db lives here)
//   SESSION_SECRET   HMAC secret; auto-generated & persisted if absent
//   GOOGLE_CLIENT_ID optional — enables "Sign in with Google"
//   COOKIE_SECURE    "0" to allow cookies over http (local dev); default on
//   CORS_ORIGINS     comma-separated extra origins for local dev
// ============================================================

import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const PORT = +(process.env.PORT || 8092);
const DATA_DIR = process.env.DATA_DIR || path.join(import.meta.dirname, 'data');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const COOKIE_SECURE = process.env.COOKIE_SECURE !== '0';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
const SESSION_DAYS = 30;
const COOKIE_NAME = 'dk_sess';

mkdirSync(DATA_DIR, { recursive: true });

// --- session secret: env, or generate once and persist ---
let SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  const secretFile = path.join(DATA_DIR, '.session_secret');
  if (!existsSync(secretFile)) writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  SECRET = readFileSync(secretFile, 'utf8').trim();
}

// --- db ---
const db = new DatabaseSync(path.join(DATA_DIR, 'darkroom.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    pass TEXT,
    google_sub TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- helpers ---
const b64u = (buf) => Buffer.from(buf).toString('base64url');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(pw, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

function signSession(userId) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const payload = `${userId}.${exp}`;
  const sig = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}
function verifySession(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  const expect = b64u(crypto.createHmac('sha256', SECRET).update(`${uid}.${exp}`).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  if (+exp < Date.now()) return null;
  return +uid;
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
function setSessionCookie(res, token) {
  const attrs = [`${COOKIE_NAME}=${token}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${SESSION_DAYS * 86400}`];
  if (COOKIE_SECURE) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, hasPassword: !!u.pass, viaGoogle: !!u.google_sub });
const getUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const getUserBySub = db.prepare('SELECT * FROM users WHERE google_sub = ?');
const getProgress = db.prepare('SELECT data FROM progress WHERE user_id = ?');
const putProgress = db.prepare(`INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
  ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// --- naive rate limit for auth endpoints ---
const attempts = new Map(); // ip -> {n, reset}
function rateLimited(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now > a.reset) { attempts.set(ip, { n: 1, reset: now + 15 * 60e3 }); return false; }
  a.n++;
  return a.n > 30;
}

async function verifyGoogleToken(credential) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) return null;
  const p = await res.json();
  if (p.aud !== GOOGLE_CLIENT_ID) return null;
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) return null;
  if (+p.exp * 1000 < Date.now()) return null;
  if (p.email_verified !== 'true' && p.email_verified !== true) return null;
  return p; // { sub, email, name, picture, ... }
}

// --- routes ---
const routes = {
  'GET /api/healthz': async (req, res) => send(res, 200, { ok: true }),

  'GET /api/config': async (req, res) => send(res, 200, { googleClientId: GOOGLE_CLIENT_ID }),

  'POST /api/auth/register': async (req, res, { body, ip }) => {
    if (rateLimited(ip)) return send(res, 429, { error: 'Too many attempts — try again later.' });
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim().slice(0, 80);
    const password = String(body.password || '');
    if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'Enter a valid email address.' });
    if (!name) return send(res, 400, { error: 'Enter your name.' });
    if (password.length < 8) return send(res, 400, { error: 'Password must be at least 8 characters.' });
    if (getUserByEmail.get(email)) return send(res, 409, { error: 'An account with this email already exists — sign in instead.' });
    const info = db.prepare('INSERT INTO users (email, name, pass) VALUES (?, ?, ?)').run(email, name, hashPassword(password));
    const user = getUserById.get(info.lastInsertRowid);
    setSessionCookie(res, signSession(user.id));
    send(res, 201, { user: publicUser(user), progress: null });
  },

  'POST /api/auth/login': async (req, res, { body, ip }) => {
    if (rateLimited(ip)) return send(res, 429, { error: 'Too many attempts — try again later.' });
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = getUserByEmail.get(email);
    if (!user) return send(res, 401, { error: 'Wrong email or password.' });
    if (!user.pass) return send(res, 401, { error: 'This account uses Google sign-in. Use the Google button.' });
    if (!verifyPassword(password, user.pass)) return send(res, 401, { error: 'Wrong email or password.' });
    setSessionCookie(res, signSession(user.id));
    const row = getProgress.get(user.id);
    send(res, 200, { user: publicUser(user), progress: row ? JSON.parse(row.data) : null });
  },

  'POST /api/auth/google': async (req, res, { body, ip }) => {
    if (!GOOGLE_CLIENT_ID) return send(res, 501, { error: 'Google sign-in is not configured.' });
    if (rateLimited(ip)) return send(res, 429, { error: 'Too many attempts — try again later.' });
    const payload = await verifyGoogleToken(String(body.credential || ''));
    if (!payload) return send(res, 401, { error: 'Google sign-in failed — try again.' });
    let user = getUserBySub.get(payload.sub);
    if (!user) {
      const existing = getUserByEmail.get(payload.email.toLowerCase());
      if (existing) {
        db.prepare('UPDATE users SET google_sub = ? WHERE id = ?').run(payload.sub, existing.id);
        user = getUserById.get(existing.id);
      } else {
        const info = db.prepare('INSERT INTO users (email, name, google_sub) VALUES (?, ?, ?)')
          .run(payload.email.toLowerCase(), payload.name || payload.email.split('@')[0], payload.sub);
        user = getUserById.get(info.lastInsertRowid);
      }
    }
    setSessionCookie(res, signSession(user.id));
    const row = getProgress.get(user.id);
    send(res, 200, { user: publicUser(user), progress: row ? JSON.parse(row.data) : null });
  },

  'POST /api/auth/logout': async (req, res) => {
    clearSessionCookie(res);
    send(res, 200, { ok: true });
  },

  'GET /api/me': async (req, res, { userId }) => {
    if (!userId) return send(res, 401, { error: 'Not signed in.' });
    const user = getUserById.get(userId);
    if (!user) { clearSessionCookie(res); return send(res, 401, { error: 'Not signed in.' }); }
    const row = getProgress.get(userId);
    send(res, 200, { user: publicUser(user), progress: row ? JSON.parse(row.data) : null });
  },

  'PUT /api/progress': async (req, res, { userId, body }) => {
    if (!userId) return send(res, 401, { error: 'Not signed in.' });
    const p = body.progress;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return send(res, 400, { error: 'Bad progress payload.' });
    const data = JSON.stringify({ lessons: p.lessons || {}, quizzes: p.quizzes || {}, last: p.last || null });
    if (data.length > 50 * 1024) return send(res, 413, { error: 'Progress payload too large.' });
    putProgress.run(userId, data);
    send(res, 200, { ok: true });
  },
};

const server = createServer(async (req, res) => {
  // CORS (local dev only — production is same-origin)
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, 'http://x');
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) return send(res, 404, { error: 'Not found.' });

  try {
    const ctx = {
      userId: verifySession(getCookie(req, COOKIE_NAME)),
      ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
      body: {},
    };
    if (req.method === 'POST' || req.method === 'PUT') ctx.body = await readBody(req);
    await handler(req, res, ctx);
  } catch (err) {
    send(res, err.message === 'payload too large' ? 413 : 400, { error: err.message || 'Bad request.' });
  }
});

server.listen(PORT, () => console.log(`darkroom api listening on :${PORT} (data: ${DATA_DIR}, google: ${GOOGLE_CLIENT_ID ? 'on' : 'off'})`));
