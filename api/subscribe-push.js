// api/subscribe-push.js
// POST  — save a push subscription (called from entrada.html after user grants permission)
// DELETE — remove a push subscription when user turns off notifications

import { kv } from '@vercel/kv';

function checkSession(req) {
  const tok = req.headers['x-session'];
  return tok && process.env.ADMIN_PW_HASH && tok === process.env.ADMIN_PW_HASH;
}

export default async function handler(req, res) {
  if (!checkSession(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'POST') {
    const sub = req.body;
    if (!sub?.endpoint || typeof sub.endpoint !== 'string') {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }
    // Use the last 64 chars of endpoint as a stable key
    const key = sub.endpoint.slice(-64);
    await kv.hset('push_subs', { [key]: JSON.stringify(sub) });
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body || {};
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'endpoint requerido' });
    }
    const key = endpoint.slice(-64);
    await kv.hdel('push_subs', key);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
