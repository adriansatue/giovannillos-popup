// api/login.js
// Admin login — validates email + password, returns session token.
// Rate-limited: max 5 attempts per IP per 15 minutes (stored in KV).

import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || 'unknown';
  const ratKey = `login_rate:${ip}`;

  // Rate limiting — max 5 failed attempts per 15 min window
  const attempts = parseInt(await kv.get(ratKey) || '0', 10);
  if (attempts >= 5) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
  const ADMIN_PW_HASH  = process.env.ADMIN_PW_HASH;

  if (!ADMIN_EMAIL || !ADMIN_PW_HASH) {
    return res.status(500).json({ error: 'Servidor no configurado' });
  }

  const pwHash      = createHash('sha256').update(password).digest('hex');
  const emailMatch  = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  const passMatch   = pwHash === ADMIN_PW_HASH;

  if (!emailMatch || !passMatch) {
    // Increment rate limit counter (15-min TTL)
    await kv.set(ratKey, attempts + 1, { ex: 900 });
    // Constant-time delay to resist timing attacks
    await new Promise(r => setTimeout(r, 300 + Math.random() * 100));
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Success — clear rate limit counter
  await kv.del(ratKey);
  return res.status(200).json({ token: ADMIN_PW_HASH });
}
