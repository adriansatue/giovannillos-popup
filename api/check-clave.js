// api/check-clave.js
// Validates a per-user order code against the KV store.
// Returns 200 on success, 401 on failure. Never leaks why it failed.

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clave } = req.body || {};
  if (!clave || typeof clave !== 'string') {
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  const codigo = clave.trim().toUpperCase();
  const raw = await kv.hget('claves', codigo);
  if (!raw) {
    return res.status(401).json({ error: 'Código incorrecto' });
  }

  return res.status(200).json({ ok: true });
}
